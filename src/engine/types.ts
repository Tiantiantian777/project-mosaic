export type Color = 'R' | 'Y' | 'G' | 'B'

export type TileColors = readonly [
  readonly [Color, Color],
  readonly [Color, Color],
]

export interface Tile {
  id: string
  colors: TileColors
}

export type Board = readonly (Tile | null)[]
export type Phase = 'placement' | 'sliding' | 'finished'
export type TileRotation = 0 | 1 | 2 | 3
export type RotationDirection = 'clockwise' | 'counterclockwise'

export interface GameState {
  readonly phase: Phase
  readonly seed: number
  readonly board: Board
  readonly visibleTiles: readonly Tile[]
  readonly drawPile: readonly Tile[]
  readonly selectedDraftIndex: number | null
  readonly selectedRotation: TileRotation
  readonly slidesRemaining: number
  readonly message: string
}

export const BOARD_DIMENSION = 4
export const BOARD_SLOT_COUNT = BOARD_DIMENSION * BOARD_DIMENSION
export const MINI_GRID_DIMENSION = BOARD_DIMENSION * 2
export const VISIBLE_DRAFT_SIZE = 3
export const SLIDE_LIMIT = 5

export const COLORS: readonly Color[] = ['R', 'Y', 'G', 'B']

export const COLOR_LABELS: Record<Color, string> = {
  R: 'Red',
  Y: 'Yellow',
  G: 'Green',
  B: 'Blue',
}
