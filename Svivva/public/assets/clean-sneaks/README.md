# Clean Sneaks — BALOON8 Car-Sneaker

## 3D asset (default)

Gameplay at `/clean-sneaks` and the homepage orbit viewer build a **real procedural 3D car-sneaker** matching the brand orthographic blueprint + Tripo / Meshy refs:

- slip-on sneaker silhouette (4610 × 1880 × 1320 mm)
- densely packed iridescent balloon pods (instanced Three.js mesh)
- neon-green e8 circular grille with bloom
- crystalline tread wheels + chrome e8 hubcaps
- BALOON8 rear plate, 6 exhausts, claw toes, mirror pods

Source:

- `lib/clean-sneaks/baloon8-car-model.ts` — advanced procedural geometry
- `lib/clean-sneaks/baloon8-shoe-model.ts` — viewer / runner wrappers
- `components/clean-sneaks/Baloon8ShoeScene.tsx` — orbit viewer + bloom

References (not used as in-game textures):

- `baloon8-orthographic-blueprint.jpg` — official 4-view brand sheet
- `baloon8-tripo-futuristic-reference.jpg` / `baloon8-tripo-puffer-reference.jpg`
- `baloon8-meshy-puffer-reference.jpg` / `baloon8-meshy-stone-reference.jpg`
- `baloon8-hero-reference.jpg`

## Optional custom flat sprite

User/AI designs via `resolvePlayerSneaker({ spriteUrl, useWalkingSprite: false })` can still point at `player-shoe.png` (marketing only — not the default 3D body).

## Future: GLB import

`types.ts` → `modelUrl?: string` can later load a Tripo/Meshy-exported `.glb`.
