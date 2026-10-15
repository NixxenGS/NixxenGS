package com.nixxengs.hhcompanion

import android.webkit.JavascriptInterface

/**
 * Exposed to the page as `window.HHAndroid`. Calls arrive on a WebView binder
 * thread, so every method just hands off to [Host], which hops to the UI thread.
 */
class NativeBridge(private val host: Host) {

    interface Host {
        fun saveFile(fileName: String, contents: String, callbackId: Int)
        fun copyText(text: String)
        fun setPageColor(cssColor: String)
    }

    @JavascriptInterface
    fun saveFile(fileName: String, contents: String, callbackId: Int) =
        host.saveFile(fileName, contents, callbackId)

    @JavascriptInterface
    fun copyText(text: String) = host.copyText(text)

    @JavascriptInterface
    fun setPageColor(cssColor: String) = host.setPageColor(cssColor)
}
