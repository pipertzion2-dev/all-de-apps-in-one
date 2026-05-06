#!/bin/bash
cd "$(dirname "$0")"
# Ensure we have a fresh deploy zip
zip -q -j deploy.zip index.html
open "https://app.netlify.com/drop"
open .
osascript -e 'display dialog "Netlify Drop opened in your browser.\n\nDrag the file deploy.zip (in the folder that just opened) onto the Netlify page.\n\nYou will get a live URL in seconds. No signup required." with title "Prompt Drift Detector — Get live URL" buttons {"OK"} default button 1'
