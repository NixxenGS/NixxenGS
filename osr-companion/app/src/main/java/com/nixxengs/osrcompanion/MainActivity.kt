package com.nixxengs.osrcompanion

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.res.Configuration
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.SystemClock
import android.util.Log
import android.view.HapticFeedbackConstants
import android.view.ViewGroup
import android.webkit.ConsoleMessage
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.addCallback
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.graphics.ColorUtils
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONObject
import kotlin.math.max

class MainActivity : ComponentActivity(), NativeBridge.Host {

    private lateinit var root: FrameLayout
    private lateinit var webView: WebView
    private lateinit var bridgeScript: String

    private var pageReady = false
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var pendingSave: PendingSave? = null

    private class PendingSave(val contents: String, val callbackId: Int)

    private val assetLoader by lazy {
        WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
    }

    private val openDocument =
        registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
            fileChooserCallback?.onReceiveValue(uri?.let { arrayOf(it) })
            fileChooserCallback = null
        }

    private val createDocument =
        registerForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
            val save = pendingSave ?: return@registerForActivityResult
            pendingSave = null
            if (uri == null) {
                settleSave(save.callbackId, ok = false, code = "declined")
                return@registerForActivityResult
            }
            Thread {
                val ok = runCatching {
                    contentResolver.openOutputStream(uri, "wt")!!.use {
                        it.write(save.contents.toByteArray(Charsets.UTF_8))
                    }
                }.onFailure { Log.w(TAG, "Saving export failed", it) }.isSuccess
                runOnUiThread {
                    if (!ok) Toast.makeText(this, R.string.save_failed, Toast.LENGTH_SHORT).show()
                    settleSave(save.callbackId, ok, if (ok) "" else "write_failed")
                }
            }.start()
        }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        val splashDeadline = SystemClock.uptimeMillis() + SPLASH_MAX_MS
        installSplashScreen().setKeepOnScreenCondition {
            !pageReady && SystemClock.uptimeMillis() < splashDeadline
        }
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        bridgeScript = assets.open("android-bridge.js").bufferedReader().use { it.readText() }
        val bg = ContextCompat.getColor(this, R.color.bg)

        if (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        webView = WebView(this).apply {
            setBackgroundColor(bg)
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = false
                setSupportZoom(false)
                textZoom = textZoomFor(resources.configuration)
            }
            addJavascriptInterface(NativeBridge(this@MainActivity), "OSRAndroid")
            webViewClient = ShellClient()
            webChromeClient = ShellChromeClient()
        }
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            WebViewCompat.addDocumentStartJavaScript(webView, bridgeScript, setOf(ORIGIN))
        }

        root = FrameLayout(this).apply {
            setBackgroundColor(bg)
            addView(webView, FrameLayout.LayoutParams(MATCH, MATCH))
        }
        // Edge-to-edge: pad for system bars, cutouts and the keyboard so the page
        // never sits underneath them; the padding shows the page colour.
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
            v.setPadding(bars.left, bars.top, bars.right, max(bars.bottom, ime.bottom))
            WindowInsetsCompat.CONSUMED
        }
        setContentView(root)
        applyBarAppearance(bg)

        onBackPressedDispatcher.addCallback(this) {
            webView.evaluateJavascript(
                "(window.__osrNative ? window.__osrNative.back() : false)"
            ) { handled ->
                if (handled != "true") {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                    isEnabled = true
                }
            }
        }

        webView.loadUrl(START_URL)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        webView.settings.textZoom = textZoomFor(newConfig)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        fileChooserCallback?.onReceiveValue(null)
        fileChooserCallback = null
        (webView.parent as? ViewGroup)?.removeView(webView)
        webView.destroy()
        super.onDestroy()
    }

    // ---- NativeBridge.Host (called on a WebView binder thread)

    override fun saveFile(fileName: String, contents: String, callbackId: Int) = runOnUiThread {
        pendingSave?.let { settleSave(it.callbackId, ok = false, code = "declined") }
        pendingSave = PendingSave(contents, callbackId)
        try {
            createDocument.launch(fileName)
        } catch (e: ActivityNotFoundException) {
            pendingSave = null
            settleSave(callbackId, ok = false, code = "unavailable")
        }
    }

    override fun copyText(text: String) = runOnUiThread {
        val clipboard = getSystemService(ClipboardManager::class.java)
        clipboard.setPrimaryClip(ClipData.newPlainText(getString(R.string.app_name), text))
    }

    override fun setPageColor(cssColor: String) {
        val parts = RGB.find(cssColor)?.groupValues ?: return
        val color = Color.rgb(parts[1].toInt(), parts[2].toInt(), parts[3].toInt())
        runOnUiThread {
            root.setBackgroundColor(color)
            webView.setBackgroundColor(color)
            applyBarAppearance(color)
        }
    }

    override fun haptic(strength: Int) = runOnUiThread {
        // Dice landings and button taps; no VIBRATE permission needed for view haptics.
        val effect = when {
            strength >= 2 -> HapticFeedbackConstants.LONG_PRESS
            strength == 1 -> HapticFeedbackConstants.VIRTUAL_KEY
            else -> HapticFeedbackConstants.CLOCK_TICK
        }
        webView.performHapticFeedback(effect)
    }

    // ---- helpers

    private fun settleSave(callbackId: Int, ok: Boolean, code: String) {
        webView.evaluateJavascript(
            "window.__osrNative && window.__osrNative.settle($callbackId, $ok, ${JSONObject.quote(code)})",
            null
        )
    }

    private fun applyBarAppearance(background: Int) {
        val light = ColorUtils.calculateLuminance(background) > 0.5
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = light
            isAppearanceLightNavigationBars = light
        }
    }

    private fun textZoomFor(config: Configuration) =
        (config.fontScale * 100).toInt().coerceIn(85, 130)

    private inner class ShellClient : WebViewClient() {
        override fun shouldInterceptRequest(
            view: WebView,
            request: WebResourceRequest
        ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)

        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            val url = request.url
            if (url.host == HOST) return false
            // Anything outside the bundled app opens in the user's browser.
            try {
                startActivity(Intent(Intent.ACTION_VIEW, url))
            } catch (e: ActivityNotFoundException) {
                Log.w(TAG, "No app to open $url", e)
            }
            return true
        }

        override fun onPageFinished(view: WebView, url: String) {
            if (!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
                view.evaluateJavascript(bridgeScript, null)
            }
            view.evaluateJavascript("window.__osrNative && window.__osrNative.reportTheme()", null)
            pageReady = true
        }
    }

    private inner class ShellChromeClient : WebChromeClient() {
        override fun onShowFileChooser(
            webView: WebView,
            filePathCallback: ValueCallback<Array<Uri>>,
            fileChooserParams: FileChooserParams
        ): Boolean {
            fileChooserCallback?.onReceiveValue(null)
            fileChooserCallback = filePathCallback
            return try {
                // JSON exports often come back as octet-stream or text, so don't filter.
                openDocument.launch(arrayOf("*/*"))
                true
            } catch (e: ActivityNotFoundException) {
                fileChooserCallback = null
                Toast.makeText(this@MainActivity, R.string.no_file_picker, Toast.LENGTH_SHORT).show()
                false
            }
        }

        override fun onConsoleMessage(message: ConsoleMessage): Boolean {
            Log.d(TAG, "${message.sourceId()}:${message.lineNumber()} ${message.message()}")
            return true
        }
    }

    private companion object {
        const val TAG = "OSRCompanion"
        const val HOST = WebViewAssetLoader.DEFAULT_DOMAIN
        const val ORIGIN = "https://$HOST"
        const val START_URL = "$ORIGIN/assets/index.html"
        const val SPLASH_MAX_MS = 2500L
        const val MATCH = ViewGroup.LayoutParams.MATCH_PARENT
        val RGB = Regex("""rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)""")
    }
}
