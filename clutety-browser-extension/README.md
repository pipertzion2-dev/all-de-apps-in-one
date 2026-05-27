# Clutety Feed Shield — Browser Extension

Hides posts about **blocked people**, **celebrities**, and **topics** from your social media feeds.

## Supported sites

- YouTube
- TikTok
- Instagram
- X (Twitter)
- Reddit
- Facebook
- LinkedIn
- Threads

## Install (Chrome / Edge)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder (`clutety-browser-extension`)

## Sync rules from Svivva

1. Open [https://svivva.com/clutety/app](https://svivva.com/clutety/app)
2. Go to **Feed Shield** tab
3. Add people to block, keywords, and platforms
4. With the extension installed, rules sync automatically when you visit Clutety on Svivva

You can also **Export rules** JSON from Svivva and import manually via extension storage if needed.

## How blocking works

Clutety scans each feed card’s **title**, **description**, **channel/creator name**, and (on Svivva) full **YouTube transcripts** when you test a URL. The extension uses the same matching rules on live feeds.

## iOS app note

The Clutety iOS app (`ClutetyMobile/`) runs the Svivva web experience. System-wide blocking inside the native YouTube app requires a future Safari Content Blocker extension.
