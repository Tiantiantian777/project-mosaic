# Project Mosaic — React/Vite MVP

A mobile-first web prototype that can be deployed directly to Vercel.

## Included

- 4×4 board
- three-tile draft
- rotation before placement
- tap-to-place interaction
- live connected-region scoring
- top-two-color final score
- whole-piece sliding
- five slide tokens
- deterministic seed-based queues
- local device save
- responsive phone layout
- no backend required

## Local development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Deploy to Vercel

1. Create a new GitHub repository.
2. Upload all files from this project folder.
3. In Vercel, choose **Add New → Project**.
4. Import the GitHub repository.
5. Vercel should detect **Vite** automatically.
6. Click **Deploy**.

The build command is:

```text
npm run build
```

The output directory is:

```text
dist
```

## Current control scheme

This first version uses tap/click placement because it is reliable on phones:

1. Choose a draft tile.
2. Rotate it.
3. Tap a highlighted legal anchor cell.
4. Start the adjustment phase.
5. Tap a placed piece.
6. Use the arrow pad to slide the complete piece.

Drag-and-drop can be added after testing the core loop.
