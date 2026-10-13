# Bending Companion

A mobile companion app for **Avatar Legends: The Roleplaying Game**, built with React Native and Expo (SDK 57). It runs on iOS, Android, and the web.

## Features

- **Party**: keep any number of characters. Each card shows stats, balance, fatigue, and any marked conditions at a glance.
- **Character sheet**
  - The four stats (Creativity, Focus, Harmony, Passion), each with a stepper.
  - An animated **balance track** between your playbook's two principles, with a movable center. It warns you when a shift would make you lose your balance.
  - **Conditions** show their roll penalties and how to clear them.
  - **Fatigue** (5 boxes), positive and negative **statuses**, and a **growth** track with advancements.
  - **Moves & techniques**: playbook moves with notes, plus techniques grouped by approach. Tap a technique's badge to move it from learned to practiced to mastered.
  - **Story**: background, demeanor, look, history, connections, and notes.
- **Roller**: pick a character and a move. The right stat or principle and every condition penalty are applied for you (for example, Troubled gives -2 to Rely on Your Skills and Training). The roll uses animated 2d6 with haptic feedback, shows the strong hit, weak hit, or miss outcome, and keeps a roll history.
- **Rules**: a searchable quick reference for moves, combat approaches, conditions, the tracks, statuses, and playbooks.
- Everything is saved on the device and stays there after the app closes.

The 10 core playbooks are built in. Use **Other playbook** to name your own principles for a supplement or homebrew playbook.

## Running it

```bash
cd bending-companion
npm install
npx expo start
```

Then scan the QR code with the **Expo Go** app on your phone. You can also press `w` to open it in the browser, or `a` / `i` for an emulator or simulator.

## Installing on Android

Every push that changes `bending-companion/` makes GitHub Actions build an installable APK (workflow: `.github/workflows/android-apk.yml`). No Expo account is needed.

1. On your phone, open the repo's **Releases** page on GitHub and choose the newest **Bending Companion (Android build N)**.
2. Download `bending-companion.apk` and open it.
3. If Android asks, allow your browser to install unknown apps, then tap **Install**.

To build without pushing a change, open **Actions → Build Android APK → Run workflow**.

These builds are signed with a shared debug key. That's fine for you and your friends, but the Play Store needs a real signing key (for example, through `npx eas-cli build -p android --profile production`).

### Alternative: EAS Build

With a free Expo account you can also build in Expo's cloud:

```bash
npx eas-cli login
npx eas-cli build -p android --profile preview   # gives an APK download link
```

Other commands:

```bash
npm run typecheck   # TypeScript check
npx expo export --platform web   # static web build in dist/
```

## Project layout

```
src/
  app/                 Expo Router screens
    (tabs)/            Party, Roll, Rules tabs
    character/[id].tsx Character sheet
    new.tsx            Character creation
  components/          UI building blocks (cards, chips, balance track, dice)
  data/game.ts         Playbooks, moves, conditions, and other rules data
  lib/                 Roll math, haptics, ids
  store/               App state and on-device persistence
```

## A note on rules content

The in-app rules text is short paraphrased reminders, not the book's wording. Avatar Legends: The Roleplaying Game is published by Magpie Games; use the core book for the full rules. This is an unofficial fan project.
