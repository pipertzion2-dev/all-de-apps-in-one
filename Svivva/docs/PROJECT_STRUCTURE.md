# Project Structure and Conventions

This document keeps Svivva maintainable as features grow.

## Folder Rules

- `app/`:
  - `app/api/<domain>/.../route.ts` for API handlers.
  - `app/<feature>/page.tsx` for UI routes.
  - Keep page-level data fetching in the route folder, not in global utilities.
- `components/`:
  - `components/ui/` for primitives only.
  - feature-specific components in `components/<feature>-*.tsx`.
- `lib/`:
  - group by concern (`auth`, `llm`, `svivva-play`, `stripe`, etc.).
  - integration wrappers live here, not directly in route files.

## API Route Conventions

- Return normalized responses:
  - success: `{ success: true, ... }` or typed payload
  - error: `{ error: "message" }`
- Prefer helpers from `lib/http-response.ts` for consistency.
- Avoid duplicating protocol code (OAuth/JWT parsing, auth parsing, etc.):
  - move shared logic to `lib/*`.

## Naming and File Hygiene

- Use lowercase, hyphenated route folders (e.g. `gsc-connect`, `growth-tasks`).
- Keep one responsibility per file when possible.
- For files over ~300 lines, extract helpers into sibling `lib` files.

## Before Merging Changes

Run:

1. `npm run check`
2. `npm run lint`
3. `npm run format:check`

If a command fails, fix before push unless explicitly deferring.
