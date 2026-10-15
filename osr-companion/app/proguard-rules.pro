# Methods called from the page through addJavascriptInterface.
-keepclassmembers class com.nixxengs.osrcompanion.NativeBridge {
    @android.webkit.JavascriptInterface <methods>;
}
