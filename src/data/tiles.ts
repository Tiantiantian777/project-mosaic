import { TileColors } from '../engine/types'

export const TILE_PATTERNS: readonly TileColors[] = [
  [['R', 'Y'], ['G', 'B']],
  [['R', 'R'], ['Y', 'B']],
  [['G', 'Y'], ['G', 'B']],
  [['B', 'R'], ['Y', 'Y']],
  [['G', 'B'], ['R', 'R']],
  [['Y', 'G'], ['B', 'G']],
  [['B', 'B'], ['R', 'Y']],
  [['Y', 'R'], ['B', 'G']],
  [['R', 'G'], ['R', 'B']],
  [['G', 'G'], ['Y', 'R']],
  [['B', 'Y'], ['B', 'R']],
  [['Y', 'B'], ['G', 'Y']],
  [['R', 'B'], ['G', 'G']],
  [['B', 'G'], ['Y', 'R']],
  [['Y', 'Y'], ['R', 'G']],
  [['G', 'R'], ['B', 'B']],
]
