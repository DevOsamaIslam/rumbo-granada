# Store release runbook

Everything in this folder is either generated (`npm run store-assets`) or a
source document for the Play Console / App Store Connect forms.

## Phase 18 status

| Task | State | Where |
|------|-------|-------|
| 18.1 Production build profiles | ✅ Done | `eas.json`, `app.config.ts`, `package.json` scripts |
| 18.2 Store listings | ✅ Drafted | `listing.json` → generated `play-store-listing.md`, `app-store-listing.md` |
| 18.3 Screenshots & assets | ✅ Android done · ⏸️ iOS pending | `docs/store/screenshots/`, `assets/store/` |
| 18.4 Internal testing validation | ✅ Local release build + device test · ⏸️ EAS track pending | see below |
| 18.5 Submit for review | ⏸️ Blocked on credentials | see below |
## TL;DR — first Android submission

The npm scripts assume a global `eas`; without one, prefix with
`npx eas-cli@latest` (e.g. `npx eas-cli@latest build --profile production -p android`).

```bash
npx eas-cli@latest login                 # Expo account
npx eas-cli@latest init                  # links the project, writes extra.eas.projectId
npx eas-cli@latest build -p android --profile production   # produces the .aab
npx eas-cli@latest credentials -p android                  # Google service account key
npx eas-cli@latest submit -p android --profile production  # draft release on `internal`
```

Then in Play Console: finish the store listing with the copy from
`play-store-listing.md`, upload `assets/store/*.png` and
`docs/store/screenshots/play-phone/es/*.png`, answer Data safety with the notes in
section 5, and promote the internal release to testers.

For iOS, replace `-p android` with `-p ios` and add `--asc-app-id <id>` (or set
`submit.production.ios.ascAppId`).



## 1. Build configuration

`eas.json` defines three profiles and remote app versions:

- `development` — dev client, APK, iOS simulator.
- `preview` — internal distribution, APK (sideloadable on a real device).
- `production` — App Bundle for Play, `autoIncrement: true`, iOS App Store.

Versions are split the Expo way:

- **Marketing version** (`app.config.ts` → `version`) is edited by hand when a
  new release starts. It is `1.0.0` today.
- **Build numbers** (`android.versionCode`, `ios.buildNumber`) are owned by EAS
  (`cli.appVersionSource: "remote"`). The values in `app.config.ts` only seed
  the first remote read; after that `autoIncrement` bumps them per build.

```bash
npm run build:preview      # eas build --profile preview --platform android
npm run build:production   # eas build --profile production (android + ios)
npm run submit:production  # eas submit --profile production
```

Nothing in this repo can run those commands yet: they need an Expo login and a
linked EAS project (`eas init` writes `extra.eas.projectId`, which is
intentionally absent from `app.config.ts`).

## 2. Accounts and secrets checklist

| Item | Needed for | How |
|------|------------|-----|
| Expo account | `eas build`, `eas submit` | `npx eas-cli@latest login` |
| EAS project | Every cloud build | `npx eas-cli@latest init` (adds `extra.eas.projectId`) |
| Android keystore | Play signing | EAS generates one on the first production build, or `eas credentials --platform android` |
| Play Console app | Submitting | Create the app for `com.rumbo.granada.app`, complete the Data safety + content rating forms |
| Google service account key | `eas submit --platform android` | Play Console → API access → service account JSON, then `eas credentials` → Google Service Account → set up key (creates the `internal` track release) |
| App Store Connect app | iOS submission | Create the app in App Store Connect, then pass `--asc-app-id` or set `submit.production.ios.ascAppId` |
| App Store Connect API key | Non-interactive iOS submit | `eas credentials --platform ios` → App Store Connect → Manage your API Key |

The submit profile keeps `android.track: "internal"` with
`releaseStatus: "draft"`, so a submission lands as a draft internal release and
a human decides when it rolls out. To publish to testers immediately:

```bash
eas submit --platform android --profile production --release-status inProgress
```

## 3. Store listing copy

Copy lives in `listing.json` (single source of truth). After editing it:

```bash
npm run store-assets
npx vitest run src/storeAssets.test.ts
```

The generator renders `play-store-listing.md` and `app-store-listing.md` and
`src/storeAssets.test.ts` enforces the store limits (name ≤ 30, subtitle ≤ 30,
short description ≤ 80, full description ≤ 4000, Apple keywords ≤ 100,
promotional text ≤ 170).

Placeholders to resolve before submitting:

- `contact.email`, `contact.supportUrl`, `contact.privacyPolicyUrl`,
  `contact.termsUrl` in `listing.json`.

## 4. Screenshots

Phone captures for `es` and `en` are committed under
`docs/store/screenshots/play-phone/<locale>/` (1080x1920, 24-bit PNG, app UI
pillarboxed on the brand gradient).

To refresh them from a connected Android device:

```bash
adb exec-out screencap -p > docs/store/screenshots/raw/es/01-map.png
# … one file per screen: 01-map, 02-lines, 03-line-detail, 04-stop-arrivals,
# 05-favorites, 06-settings (repeat inside raw/en with the app in English)
npm run store-assets
```

Keep raw captures out of the upload — only `play-phone/` is store-ready (Play
rejects images whose longest side is more than twice the shortest side, which is
why 1272x2772 device captures are re-framed to 9:16).

**iOS screenshots are pending** (this machine has no macOS/Xcode). Required by
App Store Connect:

- iPhone 6.9" — 1320x2868 or 1290x2796 (portrait)
- iPhone 6.5" — 1284x2778 or 1242x2688
- iPad 13" — required only while `ios.supportsTablet` is `true`

Decision needed: the app has not been laid out or tested for tablets. Either
set `ios.supportsTablet: false` (drops the iPad screenshot requirement) or
produce and verify tablet layouts.

## 5. Privacy declarations

- **Play → Data safety**: no data collected or shared (location is used
  on-device only; favourites/settings stay in the app's local storage); no ads,
  no analytics, no account creation.
- **Background location**: tracking checks arrivals while the phone is locked, so
  declare `ACCESS_BACKGROUND_LOCATION` as "arrival alerts for the stop the user
  chose" in the Play declaration form.
- **App Store → App privacy**: "Data Not Collected".
- **Privacy policy / terms**: `privacy-policy.md` and `terms-of-service.md` here
  are the source text; they must be published at the URLs referenced in
  `listing.json` before submission.

## 6. Known data gap before launch

The bundled feed (`resources/gtfs/`) lists 34 routes but only 27 have trips:
**F1–F6 and 1123** have no timetable data. Those lines still appear in the
Lines tab and their detail screen shows a "no timetable data yet" note instead
of a misleading empty list. `src/services/gtfsFeed.test.ts` pins this list, so
refreshing the feed will fail the test until the allow-list is updated.

Refreshing the feed is a separate task: download the current GTFS export,
replace `resources/gtfs/*.txt`, bump `CONFIG.GTFS_CACHE_VERSION` in
`src/constants/config.ts`, run the suite, and update the allow-list.

## 7. Remaining blockers for 18.5

1. Expo login + `eas init` (adds the project id).
2. Play Console app + service account key, then a first successful
   `eas submit --platform android`.
3. App Store Connect app + `ascAppId`, then `eas submit --platform ios`.
4. Real privacy/terms URLs and a support email in `listing.json`.
5. Spanish + English screenshots for iOS, or `ios.supportsTablet: false` plus an
   iPhone 6.9" capture set.
6. Human review of the listing copy and the store review answers.


## 8. Local device handover

The OPPO CPH2747 used for validation currently runs the **release** APK built by
`./gradlew assembleRelease`:

```bash
# back to the Metro/dev build for day-to-day development
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# again to the release build for a store-like check
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Both are signed with the debug keystore here; EAS manages the real upload key.

