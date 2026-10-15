# Methods called from the page through addJavascriptInterface.
-keepclassmembers class com.nixxengs.swcompanion.NativeBridge {
    @android.webkit.JavascriptInterface <methods>;
}
