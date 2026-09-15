# Clean Sneaks — Baloon8 Puffer Coupe

## 3D asset (default)

Gameplay at `/clean-sneaks` and the homepage orbit viewer build a **real procedural 3D puffer coupe** matching the Tripo / hero references:

- dark iridescent abalone quilted pods
- neon-green ornate grille with eB emblem
- chrome disc wheels with logo
- claw feet + rear crest

Source:

- `lib/clean-sneaks/baloon8-car-model.ts` — volumetric instanced puffer body
- `lib/clean-sneaks/baloon8-shoe-model.ts` — viewer / runner scale wrappers
- `components/clean-sneaks/Baloon8ShoeScene.tsx` — homepage orbit viewer

References (not used as in-game textures):

- `baloon8-tripo-puffer-reference.jpg` — Tripo dark puffer coupe
- `baloon8-hero-reference.jpg` — studio abalone hero still
- `baloon8-meshy-stone-reference.jpg` — earlier stone look (superseded)
- `baloon8-blueprint.jpg` / `player-shoe.png` — legacy mockups only

## Optional custom flat sprite

User/AI designs via `resolvePlayerSneaker({ spriteUrl, useWalkingSprite: false })` can still point at:

```
public/assets/clean-sneaks/player-shoe.png
```

That PNG is marketing/reference only — **not** the default in-game 3D body.

## Future: GLB import

`lib/clean-sneaks/types.ts` → `modelUrl?: string` can later load a Tripo/Meshy-exported `.glb` without rewriting the runner.
