# Clutety — standalone iOS app

Clutety ships as a native iOS shell (Expo) that loads the same experience embedded in Svivva at `/clutety/app`.

## Prerequisites

- Node 20+
- Xcode 15+ (for iOS Simulator / device builds)
- [EAS CLI](https://docs.expo.dev/build/setup/) for App Store builds: `npm i -g eas-cli`

## Local development

```bash
cd ClutetyMobile
npm install
npx expo start
```

Press `i` for iOS Simulator, or scan the QR code with Expo Go.

Point at local Svivva during dev (LAN IP):

```bash
# In ClutetyMobile/app.json, set extra.clutetyWebUrl to:
# http://YOUR_LAN_IP:5000/clutety/app
```

## Production URL

Default: `https://svivva.com/clutety/app`

Make sure Svivva is deployed so the WebView loads the Shield Scanner + Feed Shield UI.

## App Store build (EAS)

1. `eas login`
2. `eas build:configure`
3. `eas build --platform ios --profile production`
4. `eas submit --platform ios`

Bundle ID: `com.svivva.clutety`

## Assets

Replace placeholder icons before store submission:

- `assets/icon.png` (1024×1024)
- `assets/splash-icon.png`
- `assets/adaptive-icon.png` (Android)

## Feed blocking on iOS

System-wide YouTube blocking (i.e. inside the YouTube app or Safari) requires a **Safari Content Blocker extension** (separate target). This v1 ships Clutety inside the app WebView and persists Feed Shield rules in browser storage on `/clutety/app`. A native extension can consume the same rules in a future release.
