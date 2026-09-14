# Clean Sneaks — Player Sneaker Asset

## Replace the custom sneaker here

**Gameplay (default):** the runner draws an animated **pair of walking sneakers** on canvas (`lib/clean-sneaks/walking-shoes-renderer.ts`) — not the car-shoe blueprint.

**Optional custom flat sprite** (user/AI designs via `resolvePlayerSneaker({ spriteUrl, useWalkingSprite: false })`):

```
public/assets/clean-sneaks/player-shoe.png
```

The bundled PNG is the Baloon8 car-shoe side view (wheels) — used for marketing/3D reference only, not in-game by default.

## Baloon8 3D car-shoe

The four-view Baloon8 mockup is rebuilt in advanced Three.js:

- `lib/clean-sneaks/baloon8-shoe-model.ts` — procedural geometry (lathe hull, instanced iridescent bubbles, transparent wheels, glowing grille, footwell mandala, BALOON8 plate)
- `components/clean-sneaks/Baloon8ShoeScene.tsx` — viewer with RoomEnvironment, bloom, orbit controls
- Reference blueprint: `baloon8-blueprint.jpg`

## Future: user / AI sneakers

`lib/clean-sneaks/assets.ts` → `resolvePlayerSneaker()` resolves the player sneaker.

Later you can pass:

- a user-selected design URL
- an AI-generated sneaker texture
- a Three.js texture / GLB path (`modelUrl`)

without rewriting the game loop. Gameplay currently draws the 2D sprite on Canvas for homepage performance; Three.js is already in the repo for richer sneaker presentation later.
