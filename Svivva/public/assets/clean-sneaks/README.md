# Clean Sneaks — Player Baloon8 Stone Coupe

## 3D asset (default)

Gameplay at `/clean-sneaks` and the homepage orbit viewer build a **real procedural 3D stone coupe** — dense river-rock / cobblestone body, green grille emblem, white disc wheels with **B** logo, claw feet.

Source:

- `lib/clean-sneaks/baloon8-car-model.ts` — volumetric instanced cobblestones + wheels/grille
- `lib/clean-sneaks/baloon8-shoe-model.ts` — viewer / runner scale wrappers
- `components/clean-sneaks/Baloon8ShoeScene.tsx` — homepage orbit viewer

References (not used as in-game thumbnails):

- `baloon8-meshy-stone-reference.jpg` — Meshy-style stone coupe look
- `baloon8-hero-reference.jpg` — earlier abalone hero still
- `baloon8-blueprint.jpg` / `player-shoe.png` — legacy mockups only

## Optional custom flat sprite

User/AI designs via `resolvePlayerSneaker({ spriteUrl, useWalkingSprite: false })` can still point at:

```
public/assets/clean-sneaks/player-shoe.png
```

That PNG is marketing/reference only — **not** the default in-game 3D body.

## Future: GLB import

`lib/clean-sneaks/types.ts` → `modelUrl?: string` can later load a Meshy-exported `.glb` without rewriting the runner.
