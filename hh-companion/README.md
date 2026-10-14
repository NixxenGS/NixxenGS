# H&H Companion for Android

A native Android app for the **Heroes & Hardships** character generator and
interactive sheet. The companion (`app/src/main/assets/index.html`) ships inside
the APK unchanged, and a small Kotlin shell adds the phone-specific parts.

## Install

1. Open the repo's **Releases** page and pick the newest
   `H&H Companion (Android build N)`.
2. Download `hh-companion.apk` on your phone and open it. Allow "install unknown
   apps" for your browser or file manager if Android asks.
3. Later builds install over the old one, and your characters are kept.

## What the Android shell adds

- **Works offline.** Everything is bundled in the APK, which requests no
  permissions, including no internet.
- **Characters stay on the phone.** They're stored on the device and included
  in Android backup and device-to-device transfer.
- **Export:** the page's *Download* button opens Android's save dialog, so you
  can save the `.json` to Downloads, Drive, and so on.
- **Import:** *Choose a .json file* opens the system file picker.
- **Copy JSON** uses the Android clipboard.
- **Back button / gesture:** closes the open dialog first. In the generator it
  steps back one step and then leaves; on a sheet it returns to the character
  list. From the list, it exits the app.
- **Light and dark:** follows the system or the in-app theme setting, and the
  status and navigation bars match the page colour.
- **Layout:** draws edge to edge, keeps clear of notches and the keyboard,
  respects the system font size, and has an adaptive and themed icon plus a
  splash screen.

## Build

CI builds and publishes the APK automatically
(`.github/workflows/hh-companion-apk.yml`). To build it yourself, you need JDK 17
and the Android SDK (API 35):

```sh
cd hh-companion
./gradlew assembleRelease   # app/build/outputs/apk/release/app-release.apk
./gradlew installDebug      # debug build on a connected device (separate app id)
```

To update the companion, replace `app/src/main/assets/index.html` with the new
export. Nothing else needs to change.

## Signing

Release builds are signed with `keystore/sideload.jks` (password
`hhcompanion`). The key is in the repo so every CI build can update the
previous install. Because the repo is public, anyone could sign an APK with
this key. That's fine for sideloading among friends. Before publishing to the
Play Store, use a private key: add the repository secrets `HH_KEYSTORE_BASE64`
(`base64 -w0 your.jks`), `HH_KEYSTORE_PASSWORD`, `HH_KEY_ALIAS` and
`HH_KEY_PASSWORD`, and CI will use them instead. Note that switching keys means
uninstalling the old build once.
