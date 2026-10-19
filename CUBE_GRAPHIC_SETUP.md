# Digital Cube Face Custom Graphic Setup

## Overview
The "Digital" cube face now uses a custom background graphic while maintaining the "Digital" text overlay and all visual effects (opacity, lighting, etc.).

## Required Action
You need to add your custom digital camouflage graphic file:

### File Location
```
/workspace/Svivva/public/assets/cube-graphics/digital-camo.jpg
```

### File Specifications
- **Format**: JPG or PNG
- **Recommended Size**: 1024x1024px or larger
- **Content**: Your burgundy/maroon digital camouflage pattern with leaf elements

### Steps to Add Your Graphic
1. Navigate to `/workspace/Svivva/public/assets/cube-graphics/`
2. Place your image file there and name it `digital-camo.jpg`
3. The cube will automatically use this graphic as the background

## What Changed

### Code Changes
1. **artifact-canvas.tsx**: Modified to check if a custom graphic exists for the "api" (Digital) face
   - If found, uses the custom graphic as the background
   - Text "Digital" and all effects remain the same
   
2. **media-assets.ts**: Added `cubeFaceGraphics` configuration
   ```typescript
   cubeFaceGraphics: {
     digital: "/assets/cube-graphics/digital-camo.jpg",
   }
   ```

### Visual Result
- Background: Your custom digital camo graphic
- Text: "Digital" (unchanged)
- Effects: Same opacity, emissive lighting, and hover effects
- Behavior: Same drag, rotation, and tap interactions

## Testing
After adding your image file:
1. Build and run the app
2. Navigate to the homepage with the 3D cube
3. The "Digital" face should show your custom camo background
4. Verify the text is still readable and effects work correctly

## Fallback
If the file is not found, the cube will fall back to the default artwork (api.png) automatically.
