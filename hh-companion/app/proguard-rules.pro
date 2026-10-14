# Methods called from the page through addJavascriptInterface.
-keepclassmembers class com.nixxengs.hhcompanion.NativeBridge {
    @android.webkit.JavascriptInterface <methods>;
}
