# OSR Companion for Android

A mobile character app for **OSR 5th Edition** (5.5e homebrew), built around the
OSR Character Record Sheet and the Class Compendium 1.5. It opens on
**Zaphyre Blight** (Tiefling 1 / Cleric 2, Twilight Domain) exactly as written on the
PDF sheet, and checks every choice against the rules.

## Install

1. Open the repo's **Releases** page and pick the newest
   `OSR Companion (Android build N)`.
2. Download `osr-companion.apk` on your phone and open it. Allow "install unknown
   apps" if Android asks.
3. Later builds install over the old one and keep your character.

## What's inside

- **One-page dashboard:** HP ring, Vitality and Acumen meters, AC, initiative,
  speed, spell slots, pact slot, Bardic Inspiration, Channel Divinity, ability
  checks, attacks and cantrips, and the key saves.
- **Sub-menus, no tabs:** the grid button opens a launcher. Each section slides in
  as its own page: Saving Throws, Skills, Combat, Spellbook, Features, Inventory,
  Rules Check, Journal, Dice Lab, Character and Settings.
- **3D dice:** real polyhedra (d4 to d20, plus d%) are thrown with light physics
  and settle on the rolled face. Includes advantage and disadvantage, crits that
  double the damage dice, and Heroic Inspiration rerolls paid with Acumen. Haptics
  and sound are optional. The dice tray (floating button) builds pools like
  `2d6+1d4+3`.
- **Rules engine:**
  - The OSR paired saves: both ability bonuses, plus proficiency once for each
    proficient ability.
  - Vitality = STR + DEX + CON bonuses, lost before HP. Acumen = INT + WIS + CHA
    bonuses.
  - Multiclass slots, kept separate from Tiefling pact magic.
  - Cantrip scaling and upcasting.
  - Encumbrance at STR × 5 / 10 / 15.
- **Rules check:** validates class order and multiclass prerequisites, save
  proficiencies, skill sources, spell counts and lists, armor and weapon
  proficiency, HP range, starting gear, burden and XP. It also has a
  **sheet audit**, which compares each number on the PDF with the value the
  rules calculate.
- **Play tools:**
  - Damage, healing and temp HP on a keypad.
  - Short rests (spending hit dice) and long rests.
  - Concentration, conditions, exhaustion and death saves.
  - Inventory with weights and coins.
  - Journal and JSON export/import.

## Zaphyre's validation results

The sheet audit matches **61 of 63** numbers. The two differences, and the other
findings:

| | Finding |
|---|---|
| ⚠️ | **HP 25** is 1 above the fixed average of 24 (10 + 7 + 7). It's legal only if the hit dice were rolled. |
| ⚠️ | **Encumbered:** 48 lb carried, but STR 7 allows 35 lb before encumbrance. Speed drops to 20 ft (the sheet says 30). |
| ⚠️ | **Diplomat's pack** weighs 39 lb, not 36, so the total is 51 lb. |
| ⚠️ | **Starting gear:** the Tiefling kit's **dagger** and **lute (or other instrument)** aren't on the sheet. |
| ℹ️ | Shield proficiency (from Cleric) is unused. A shield would make AC 13. |
| ℹ️ | The rapier lists the *Vex* mastery, but neither class grants Weapon Mastery. |
| ℹ️ | Acolyte grants 2 languages and one is still unchosen. "Dragon" is normally called *Draconic*. |
| ℹ️ | XP is blank. Level 3 starts at 900 XP. |
| ✅ | Everything else checks out: Tiefling first (race-class), Cleric WIS 13 prerequisite, INT/CHA saves, all 15 paired saves, the 4 Tiefling skills + 2 Acolyte skills, 3 instruments, cantrips and spells known/prepared, Twilight domain spells, both spell DCs and attack bonuses, slots, Bardic Inspiration ×4 and Channel Divinity ×1. |

## Build

CI builds and publishes the APK (`.github/workflows/osr-companion-apk.yml`). To
build it locally you need JDK 17 and the Android SDK (API 35):

```sh
cd osr-companion
./gradlew assembleRelease   # app/build/outputs/apk/release/app-release.apk
```

The app itself is plain HTML/JS in `app/src/main/assets/`. Open `index.html` in a
browser to work on it without building. `js/data.js` holds the rules data,
`js/rules.js` the calculations and validation, `js/dice3d.js` the dice (on the
bundled three.js r128), and `js/app.js` the UI.

## Signing

Release builds are signed with `keystore/sideload.jks` (password `osrcompanion`)
so every CI build installs over the previous one. To use a private key, add the
repository secrets `OSR_KEYSTORE_BASE64`, `OSR_KEYSTORE_PASSWORD`, `OSR_KEY_ALIAS`
and `OSR_KEY_PASSWORD`.
