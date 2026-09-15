# Clean Sneaks — BALOON8 Tripo Coupe

## Thumbnail (homepage / OG)

Official sneaker side render:

```
public/assets/clean-sneaks/baloon8-sneaker-thumbnail.png
```

(Same art as `player-shoe.png`.) Used by:

- Homepage Clean Sneaks section (default preview)
- Open Graph / Twitter cards for `/clean-sneaks`
- 2D side sprite preload

## 3D asset

Optional orbit viewer (toggle “Orbit 3D”) and `/clean-sneaks` runner build a procedural
Tripo-style puffer coupe in Three.js (`baloon8-car-model.ts`): quilted iridescent pods,
neon rectangular grille, chrome disc wheels, spoiler, claw toes.

There is no GLB yet — Tripo/Meshy exports are reference stills only. To swap in a real
exported mesh later, put a decimated GLB under this folder and wire `SneakerAssetRef.modelUrl`.

## References

- `baloon8-tripo-futuristic-reference.jpg` / `baloon8-tripo-puffer-reference.jpg` — target look
- `baloon8-orthographic-blueprint.jpg` — 4-view brand sheet
- `baloon8-meshy-puffer-reference.jpg` — Meshy puffer variant
- `baloon8-blueprint.jpg` — legacy 2×2 mockup sheet
