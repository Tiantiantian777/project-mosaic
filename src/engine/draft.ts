import { TILE_PATTERNS } from '../data/tiles'
import { Tile, TileColors, VISIBLE_DRAFT_SIZE } from './types'

function mulberry32(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let mixed = value
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

function copyColors(colors: TileColors): TileColors {
  return [
    [colors[0][0], colors[0][1]],
    [colors[1][0], colors[1][1]],
  ]
}

export function createDraftQueue(seed: number, size = 18): Tile[] {
  const random = mulberry32(seed)

  return Array.from({ length: size }, (_, index) => {
    const pattern = TILE_PATTERNS[Math.floor(random() * TILE_PATTERNS.length)]
    return {
      id: `tile-${String(index + 1).padStart(2, '0')}`,
      colors: copyColors(pattern),
    }
  })
}

export function dealInitialDraft(seed: number): {
  visibleTiles: Tile[]
  drawPile: Tile[]
} {
  const queue = createDraftQueue(seed)
  return {
    visibleTiles: queue.slice(0, VISIBLE_DRAFT_SIZE),
    drawPile: queue.slice(VISIBLE_DRAFT_SIZE),
  }
}
