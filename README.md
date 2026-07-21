# Project Mosaic

Project Mosaic is a mobile-first color strategy game built on a 4×4 sliding-puzzle board.

> **Design decision:** Project Mosaic uses fixed 2×2 color-pattern tiles in a 4×4 sliding-puzzle board. It is not an arbitrary-polyomino placement game.

## Game rules

### Tile selection and placement

- The board contains sixteen large square slots.
- Every Mosaic tile is one rigid square containing a 2×2 pattern of colored mini-cells.
- Three pattern tiles are visible in the draft.
- Choose one visible tile and optionally rotate its internal color pattern before placement.
- Place the complete square into one empty large slot. Its orientation locks immediately.
- A placed tile cannot rotate or move during the rest of the placement phase.
- A replacement enters the draft after each placement.
- After fifteen tiles are placed, one large slot remains empty and the sliding phase begins.
- Tiles never flip, overlap, or occupy individual mini-cell positions.

### Sliding phase

- Only a tile orthogonally adjacent to the empty slot can move.
- A move swaps that tile with the empty slot.
- Tap a legal tile or drag it along its row or column toward the empty slot.
- Sliding moves never rotate a tile or change its locked color orientation.
- The current rules allow five slides. The player may also finish early.

### Scoring

Each 2×2 tile pattern expands the 4×4 large-slot board into an effective 8×8 mini-cell grid. The empty large slot contributes four empty mini-cells.

- Connections are orthogonal.
- Matching colors connect within a tile and across tile boundaries.
- Each color scores the size of its largest connected region.
- The final score is the sum of the two largest per-color region scores.

## Architecture

```text
src/
  components/   React presentation and pointer interaction
  data/         Fixed 2×2 color-pattern definitions
  engine/       Pure, immutable game rules and scoring
  styles/       Responsive visual system
```

The board array is the single source of truth for tile positions. Engine modules do not import React, and UI components call the engine for placement and slide legality.

## Local development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint
npm run test
npm run build
```

## Deployment

Vercel should detect Vite automatically.

- Build command: `npm run build`
- Output directory: `dist`

Progress is stored locally in the browser. No account or backend is required.
