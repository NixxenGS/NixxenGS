# Origin Story (mobile)

A mobile companion for **Sentinel Comics: The Roleplaying Game**. It builds heroes, runs them at the table, and gives the GM a scene tracker. It's built with React Native and Expo (SDK 57) and runs on iOS, Android, and the web.

This is the phone version of the Origin Story web builder. Heroes use the same JSON format, so a hero exported from one opens in the other.

## Features

### Heroes
- Keep any number of heroes. Each card shows status dice, current Health, and how many builder steps are done.
- Duplicate, delete, import, and export heroes. Import works with a file, the clipboard, or pasted JSON.

### Builder
- All 8 steps from the core book: Background, Power Source, Archetype, Personality, Red Abilities, Retcon, Health, and Finishing.
- **Guided** mode: roll the dice in the app, or tap a die to type in a physical roll. Only results you can reach are selectable, and you get one re-roll.
- **Constructed** mode: pick anything. **Bend rules** lifts the list restrictions (with GM permission).
- Assigning a die is a tap and a search sheet. Picking a trait you already have keeps the bigger die and gives you the smaller one back to assign.
- The special archetypes are supported: Divided, Modular (modes), Form-Changer (forms), and Minion-Maker (minion forms).
- Abilities show their `[power]` blanks as tappable fill-ins, and you can rename any ability.
- Every step lists what's still to do. A "Hero so far" sheet is one tap away.
- The hero sheet can be copied as text or exported as JSON.

### Play mode
- **Health**: big −/+ buttons (long-press for ±5), quick-damage chips, and a damage/heal amount pad. A zone bar shows where you are.
- **Zone and status**: your status die is picked for you. It's whichever is closer to Out: your Health zone or the scene's zone. When the hero is in the GM's scene on the same device, the scene tracker sets the scene zone.
- **Dice pool**: tap a power and a quality, then roll. The dice are sorted into Min, Mid, and Max, and the effect die is highlighted. Basic actions use Mid. If you tap **Roll with this** on an ability, the effect follows that ability's text ("use your Max die", "Max+Min", and so on). It also preselects the power and quality the ability names. Doubles and 1s are flagged.
- **Bonuses and penalties**: add them as persistent or exclusive and apply them to a roll. One-use mods are cleared after the roll.
- **Abilities**: Green, Yellow, Red, and Out tabs, locked until your zone allows them. You can mark abilities as used. Principles show their twists.
- Hero points, forms and modes, and session notes.

### GM scene tracker
- A Green/Yellow/Red tracker with presets or a custom number of boxes. **Next round** advances the tracker and clears who has acted.
- Turn order with acted checkmarks. Heroes show their live Health.
- Villains track Health. Lieutenants and minions show a die you can shrink or grow, and minions have a count. **Roll save** rolls the die, and you decide what happens. The environment can hold notes.

### Dice and rules
- A free dice roller with Min, Mid, Max, and total, plus a roll log shared with play mode.
- A searchable quick reference covering how rolls work, the basic actions, all powers and qualities, principles and twists, Red abilities, and the minion chart and forms.

Everything is saved on the device. Light, dark, and automatic themes are available.

## Running it

```bash
cd origin-story
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone. You can also press `w` for the browser, or `a` / `i` for an emulator.

## Installing on Android

Every push that changes `origin-story/` makes GitHub Actions build an installable APK (workflow: `.github/workflows/origin-story-apk.yml`). No Expo account is needed.

1. On your phone, open the repo's **Releases** page on GitHub and choose the newest **Origin Story (Android build N)**.
2. Download `origin-story.apk` and open it.
3. If Android asks, allow your browser to install unknown apps, then tap **Install**.

To build without pushing a change, open **Actions → Build Origin Story APK → Run workflow**.

To update, install a newer APK over the old one. Your heroes stay on the phone. These builds are signed with a shared debug key. That's fine for you and your friends, but the Play Store needs a real signing key (for example, through `npx eas-cli build -p android --profile production`).

With a free Expo account you can also build in Expo's cloud: `npx eas-cli login`, then `npx eas-cli build -p android --profile preview`.

## Other commands

```bash
npm run typecheck                 # TypeScript check
npx expo export --platform web    # static web build in dist/
```

## Project layout

```
src/
  app/                  Expo Router screens
    (tabs)/             Heroes, Scene (GM), Dice, Rules
    build/[id].tsx      Hero builder (8 steps + sheet)
    play/[id].tsx       Play mode
  components/
    builder/            Step screens and builder controls
    play/               Dice pool roller, animated dice
    HeroSheet.tsx       Read-only hero sheet
    ui.tsx              Buttons, chips, picker sheets, dice badges
  data/rules.ts         Rules tables (backgrounds, archetypes, principles…)
  engine/hero.ts        Hero model and rules engine (same format as the web builder)
  store/store.tsx       App state, scene tracker, on-device storage
```

## A note on rules content

The rules data is carried over from the Origin Story web builder, which transcribed it from the core rulebook for personal use. Sentinel Comics: The Roleplaying Game is published by Greater Than Games; use the core book for the full rules. This is an unofficial fan project.
