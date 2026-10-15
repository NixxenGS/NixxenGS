# Savage Worlds Companion for Android

A native Android app for the **Savage Worlds Adventure Edition** character
builder, interactive sheet, setting rules and codex. The companion
(`app/src/main/assets/index.html`) ships inside the APK unchanged, and a small
Kotlin shell adds the phone-specific parts.

## Install

1. Open the repo's **Releases** page and pick the newest
   `Savage Worlds Companion (Android build N)`.
2. Download `savage-worlds-companion.apk` on your phone and open it. Allow
   "install unknown apps" for your browser or file manager if Android asks.
3. Later builds install over the old one, and your heroes are kept.

## What the Android shell adds

- **Works offline.** Everything is bundled in the APK, including the page's
  Google Fonts (Big Shoulders Display, Alegreya, Alegreya Sans SC, latin
  subsets, in `assets/fonts/`). The app requests no permissions, including no
  internet.
- **Heroes stay on the phone.** They're stored on the device and included in
  Android backup and device-to-device transfer.
- **Export:** *Download .json* (heroes, full backups and setting packs) opens
  Android's save dialog, so you can save to Downloads, Drive, and so on.
- **Import:** *Choose a .json file* opens the system file picker; the portrait
  picker opens the image picker.
- **Copy JSON** uses the Android clipboard.
- **Print:** the sheet's *Print* button opens Android's print dialog, which
  can also save the sheet as a PDF.
- **Back button / gesture:** closes the open dialog first, then the roll
  result panel. In the Builder it steps back one step; on any other tab it
  returns to the Roster. From the Roster, it exits the app.
- **Parchment and Lamplight:** the status and navigation bars follow the
  in-app theme.
- **Layout:** draws edge to edge, keeps clear of notches and the keyboard,
  respects the system font size, and has an adaptive and themed icon plus a
  splash screen.

## Build

CI builds and publishes the APK automatically
(`.github/workflows/swade-companion-apk.yml`). To build it yourself, you need
JDK 17 and the Android SDK (API 35):

```sh
cd swade-companion
./gradlew assembleRelease   # app/build/outputs/apk/release/app-release.apk
./gradlew installDebug      # debug build on a connected device (separate app id)
```

To update the companion, replace `app/src/main/assets/index.html` with the new
export. If a new version links different Google Fonts, refresh
`assets/fonts/` to match; otherwise nothing else needs to change.

## Signing

Release builds are signed with `keystore/sideload.jks` (password
`swcompanion`). The key is in the repo so every CI build can update the
previous install. Because the repo is public, anyone could sign an APK with
this key. That's fine for sideloading among friends. Before publishing to the
Play Store, use a private key: add the repository secrets `SW_KEYSTORE_BASE64`
(`base64 -w0 your.jks`), `SW_KEYSTORE_PASSWORD`, `SW_KEY_ALIAS` and
`SW_KEY_PASSWORD`, and CI will use them instead. Note that switching keys means
uninstalling the old build once.
