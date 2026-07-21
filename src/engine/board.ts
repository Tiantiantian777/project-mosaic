import {
  BOARD_DIMENSION,
  BOARD_SLOT_COUNT,
  Board,
  Tile,
  TileColors,
} from './types'

export function createEmptyBoard(): Board {
  return Array<Tile | null>(BOARD_SLOT_COUNT).fill(null)
}

export function countTiles(board: Board): number {
  return board.reduce((count, tile) => count + (tile ? 1 : 0), 0)
}

export function getEmptySlotIndices(board: Board): number[] {
  return board.flatMap((tile, index) => (tile === null ? [index] : []))
}

export function getSingleEmptySlot(board: Board): number | null {
  const emptySlots = getEmptySlotIndices(board)
  return emptySlots.length === 1 ? emptySlots[0] : null
}

export function getTileIndex(board: Board, tileId: string): number {
  return board.findIndex((tile) => tile?.id === tileId)
}

export function toBoardCoordinates(index: number): {
  row: number
  column: number
} {
  return {
    row: Math.floor(index / BOARD_DIMENSION),
    column: index % BOARD_DIMENSION,
  }
}

export function areOrthogonallyAdjacent(
  firstIndex: number,
  secondIndex: number,
): boolean {
  const first = toBoardCoordinates(firstIndex)
  const second = toBoardCoordinates(secondIndex)
  return (
    Math.abs(first.row - second.row) +
      Math.abs(first.column - second.column) ===
    1
  )
}

export function placeTileInSlot(
  board: Board,
  slotIndex: number,
  tile: Tile,
): Board {
  if (
    slotIndex < 0 ||
    slotIndex >= BOARD_SLOT_COUNT ||
    board[slotIndex] !== null
  ) {
    return board
  }

  const nextBoard = [...board]
  nextBoard[slotIndex] = tile
  return nextBoard
}

export function isTileColors(value: unknown): value is TileColors {
  if (!Array.isArray(value) || value.length !== 2) return false

  return value.every(
    (row) =>
      Array.isArray(row) &&
      row.length === 2 &&
      row.every((color) => ['R', 'Y', 'G', 'B'].includes(String(color))),
  )
}

export function isTile(value: unknown): value is Tile {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<Tile>
  return typeof candidate.id === 'string' && isTileColors(candidate.colors)
}

export function isValidSlidingBoard(board: Board): boolean {
  if (board.length !== BOARD_SLOT_COUNT || countTiles(board) !== 15) {
    return false
  }

  const tileIds = board.flatMap((tile) => (tile ? [tile.id] : []))
  return (
    new Set(tileIds).size === 15 &&
    board.every((tile) => tile === null || isTile(tile))
  )
}
