# Clean Sneaks — Player Sneaker Asset

## Replace the custom sneaker here

**Primary player sprite (required):**

```
public/assets/clean-sneaks/player-shoe.png
```

Optional JPG fallback:

```
public/assets/clean-sneaks/player-shoe.jpg
```

Recommended: **side-profile PNG with transparent background**, facing right, ~900×300 or similar aspect.

The current file is cropped from the official ZZAI Three.js shoe blueprint (`blueprint-source.jpg`).

## Future: user / AI sneakers

`lib/clean-sneaks/assets.ts` → `resolvePlayerSneaker()` resolves the player sneaker.

Later you can pass:

- a user-selected design URL
- an AI-generated sneaker texture
- a Three.js texture / GLB path (`modelUrl`)

without rewriting the game loop. Gameplay currently draws the 2D sprite on Canvas for homepage performance; Three.js is already in the repo for richer sneaker presentation later.
