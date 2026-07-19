export type ColorKey = 'R' | 'Y' | 'G' | 'B'
export type Phase = 'placement' | 'adjustment' | 'finished'

export interface TileCell {
  row: number
  col: number
  color: ColorKey
}

export interface TileDefinition {
  id: string
  cells: TileCell[]
}

export interface PlacedTile {
  instanceId: string
  tileId: string
  cells: TileCell[]
  row: number
  col: number
}

export interface GameState {
  boardSize: number
  phase: Phase
  seed: number
  drawPile: TileDefinition[]
  visible: TileDefinition[]
  placedTiles: PlacedTile[]
  selectedDraftIndex: number | null
  rotation: number
  selectedPieceId: string | null
  slideTokens: number
  nextInstanceNumber: number
  message: string
}

export const COLOR_LABELS: Record<ColorKey, string> = {
  R: 'Red',
  Y: 'Yellow',
  G: 'Green',
  B: 'Blue',
}

export const TILE_LIBRARY: TileDefinition[] = [
  { id: 'A', cells: [{ row: 0, col: 0, color: 'R' }] },
  { id: 'B', cells: [{ row: 0, col: 0, color: 'B' }] },
  { id: 'C', cells: [{ row: 0, col: 0, color: 'G' }] },
  { id: 'D', cells: [{ row: 0, col: 0, color: 'Y' }] },
  {
    id: 'E',
    cells: [
      { row: 0, col: 0, color: 'R' },
      { row: 0, col: 1, color: 'B' },
    ],
  },
  {
    id: 'F',
    cells: [
      { row: 0, col: 0, color: 'G' },
      { row: 1, col: 0, color: 'Y' },
    ],
  },
  {
    id: 'G',
    cells: [
      { row: 0, col: 0, color: 'R' },
      { row: 0, col: 1, color: 'R' },
    ],
  },
  {
    id: 'H',
    cells: [
      { row: 0, col: 0, color: 'B' },
      { row: 1, col: 0, color: 'B' },
    ],
  },
  {
    id: 'I',
    cells: [
      { row: 0, col: 0, color: 'R' },
      { row: 1, col: 0, color: 'G' },
      { row: 1, col: 1, color: 'B' },
    ],
  },
  {
    id: 'J',
    cells: [
      { row: 0, col: 0, color: 'Y' },
      { row: 0, col: 1, color: 'R' },
      { row: 1, col: 0, color: 'G' },
    ],
  },
  {
    id: 'K',
    cells: [
      { row: 0, col: 0, color: 'B' },
      { row: 0, col: 1, color: 'Y' },
      { row: 0, col: 2, color: 'R' },
    ],
  },
  {
    id: 'L',
    cells: [
      { row: 0, col: 0, color: 'G' },
      { row: 1, col: 0, color: 'G' },
      { row: 2, col: 0, color: 'B' },
    ],
  },
  {
    id: 'M',
    cells: [
      { row: 0, col: 0, color: 'R' },
      { row: 0, col: 1, color: 'Y' },
      { row: 1, col: 0, color: 'B' },
      { row: 1, col: 1, color: 'G' },
    ],
  },
  {
    id: 'N',
    cells: [
      { row: 0, col: 0, color: 'R' },
      { row: 1, col: 0, color: 'Y' },
      { row: 2, col: 0, color: 'G' },
      { row: 2, col: 1, color: 'B' },
    ],
  },
]

function mulberry32(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildDrawPile(seed: number, size = 36): TileDefinition[] {
  const random = mulberry32(seed)
  return Array.from({ length: size }, () => {
    const index = Math.floor(random() * TILE_LIBRARY.length)
    return structuredClone(TILE_LIBRARY[index])
  })
}

export function rotateCells(cells: TileCell[], quarterTurns: number): TileCell[] {
  let result = cells.map((cell) => ({ ...cell }))
  const turns = ((quarterTurns % 4) + 4) % 4

  for (let i = 0; i < turns; i += 1) {
    result = result.map(({ row, col, color }) => ({
      row: col,
      col: -row,
      color,
    }))
  }

  const minRow = Math.min(...result.map((cell) => cell.row))
  const minCol = Math.min(...result.map((cell) => cell.col))

  return result.map(({ row, col, color }) => ({
    row: row - minRow,
    col: col - minCol,
    color,
  }))
}

export function occupiedCells(
  placedTiles: PlacedTile[],
  ignoreInstanceId?: string,
): Map<string, { instanceId: string; color: ColorKey }> {
  const occupied = new Map<string, { instanceId: string; color: ColorKey }>()

  for (const piece of placedTiles) {
    if (piece.instanceId === ignoreInstanceId) continue
    for (const cell of piece.cells) {
      occupied.set(`${piece.row + cell.row},${piece.col + cell.col}`, {
        instanceId: piece.instanceId,
        color: cell.color,
      })
    }
  }

  return occupied
}

export function canPlace(
  placedTiles: PlacedTile[],
  cells: TileCell[],
  top: number,
  left: number,
  boardSize: number,
  ignoreInstanceId?: string,
): boolean {
  const occupied = occupiedCells(placedTiles, ignoreInstanceId)

  return cells.every((cell) => {
    const row = top + cell.row
    const col = left + cell.col
    const inside = row >= 0 && row < boardSize && col >= 0 && col < boardSize
    return inside && !occupied.has(`${row},${col}`)
  })
}

export function canSlide(
  state: GameState,
  instanceId: string,
  deltaRow: number,
  deltaCol: number,
): boolean {
  if (
    ![
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ].some(([row, col]) => row === deltaRow && col === deltaCol)
  ) {
    return false
  }

  const piece = state.placedTiles.find((item) => item.instanceId === instanceId)
  if (!piece) return false

  return canPlace(
    state.placedTiles,
    piece.cells,
    piece.row + deltaRow,
    piece.col + deltaCol,
    state.boardSize,
    instanceId,
  )
}

export function colorGrid(state: GameState): Array<Array<ColorKey | null>> {
  const grid = Array.from({ length: state.boardSize }, () =>
    Array<ColorKey | null>(state.boardSize).fill(null),
  )

  for (const piece of state.placedTiles) {
    for (const cell of piece.cells) {
      grid[piece.row + cell.row][piece.col + cell.col] = cell.color
    }
  }

  return grid
}

export function pieceGrid(state: GameState): Array<Array<string | null>> {
  const grid = Array.from({ length: state.boardSize }, () =>
    Array<string | null>(state.boardSize).fill(null),
  )

  for (const piece of state.placedTiles) {
    for (const cell of piece.cells) {
      grid[piece.row + cell.row][piece.col + cell.col] = piece.instanceId
    }
  }

  return grid
}

export function scoreByColor(state: GameState): Record<ColorKey, number> {
  const grid = colorGrid(state)
  const colors: ColorKey[] = ['R', 'Y', 'G', 'B']
  const result: Record<ColorKey, number> = { R: 0, Y: 0, G: 0, B: 0 }

  for (const color of colors) {
    const visited = new Set<string>()
    let best = 0

    for (let row = 0; row < state.boardSize; row += 1) {
      for (let col = 0; col < state.boardSize; col += 1) {
        const startKey = `${row},${col}`
        if (grid[row][col] !== color || visited.has(startKey)) continue

        let size = 0
        const queue: Array<[number, number]> = [[row, col]]
        visited.add(startKey)

        while (queue.length > 0) {
          const [currentRow, currentCol] = queue.shift()!
          size += 1

          const neighbors: Array<[number, number]> = [
            [currentRow - 1, currentCol],
            [currentRow + 1, currentCol],
            [currentRow, currentCol - 1],
            [currentRow, currentCol + 1],
          ]

          for (const [nextRow, nextCol] of neighbors) {
            const key = `${nextRow},${nextCol}`
            const inside =
              nextRow >= 0 &&
              nextRow < state.boardSize &&
              nextCol >= 0 &&
              nextCol < state.boardSize

            if (
              inside &&
              grid[nextRow][nextCol] === color &&
              !visited.has(key)
            ) {
              visited.add(key)
              queue.push([nextRow, nextCol])
            }
          }
        }

        best = Math.max(best, size)
      }
    }

    result[color] = best
  }

  return result
}

export function topTwoScore(state: GameState): number {
  return Object.values(scoreByColor(state))
    .sort((a, b) => b - a)
    .slice(0, 2)
    .reduce((sum, value) => sum + value, 0)
}

export function createInitialState(seed: number): GameState {
  const drawPile = buildDrawPile(seed)
  const visible = drawPile.splice(0, 3)

  return {
    boardSize: 4,
    phase: 'placement',
    seed,
    drawPile,
    visible,
    placedTiles: [],
    selectedDraftIndex: null,
    rotation: 0,
    selectedPieceId: null,
    slideTokens: 5,
    nextInstanceNumber: 1,
    message: 'Choose one of the three tiles.',
  }
}
