# OSR Companion for Android

A mobile character app for **OSR 5th Edition**, D&D 5.5e (2024) rules with homebrew, built around the
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

## Rules basis

The app uses **D&D 5.5e (2024)** rules, with the OSR homebrew from the record sheet
and the Class Compendium on top. Race-classes, paired saves, Vitality and Acumen,
and encumbrance at STR × 5/10/15 are homebrew. 2024 rules cover backgrounds
(ability increases, an Origin feat, skills, a tool and equipment), languages,
spell versions, exhaustion (−2 per level to d20 tests and −5 ft speed per level),
long rests (all hit dice back), Heroic Inspiration, Weapon Mastery, and unarmed
strike/grapple/shove. Where the compendium is explicit, it wins over 2024 (for
example, Cleric preparation is WIS + Cleric level).

## Zaphyre's validation results

| | Finding |
|---|---|
| ⚠️ | **Origin feat missing:** the 2024 Acolyte grants **Magic Initiate (Cleric)**: 2 cleric cantrips + 1 level 1 cleric spell, with INT, WIS or CHA. The sheet says *Feats: None*. Pick them in Spellbook → Manage. |
| ⚠️ | **Calligrapher's Supplies** (Acolyte tool) missing. |
| ⚠️ | **Acolyte equipment** missing: option A (Calligrapher's Supplies, prayer book, Holy Symbol, parchment, robe, 8 GP) or B (50 GP). |
| ⚠️ | **Tiefling gear:** dagger and lute (or other instrument) missing. |
| ⚠️ | **HP 25** is 1 over the fixed average of 24. Legal only if rolled. |
| ⚠️ | **Encumbered:** 48 lb vs 35 lb (STR 7 × 5), so speed is 20 ft. Also, the Diplomat's pack weighs 39 lb, not 36. |
| ⚠️ | **2014 spell stats on the sheet:** Sleep (now 60 ft, concentration, a save) and Spare the Dying (now a bonus action at 15 ft). |
| ℹ️ | Scores must have been **rolled**: STR 7 is below the point-buy/standard-array minimum of 8. A fit: Acolyte +2 INT +1 WIS gives base 7/10/15/15/14/16. |
| ℹ️ | *Shelter of the Faithful* is the 2014 Acolyte feature, replaced by the Origin feat. |
| ℹ️ | Languages: 2024 gives Common + 2 standard. Infernal is a rare language, so it needs the race-class (or DM) to grant it. "Dragon" is normally called *Draconic*. |
| ℹ️ | The rapier's Vex mastery needs Weapon Mastery, which neither class grants. Shield proficiency is unused (a shield would make AC 13). XP is blank. |
| ✅ | Passes: class order, Cleric WIS 13, INT/CHA saves, all 15 paired saves, skills, instruments, cantrips and spells known/prepared, domain spells, DCs and attack bonuses, slots, Bardic Inspiration and Channel Divinity. |

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
