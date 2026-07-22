import { isValidSlidingBoard } from './board'
import { Board, SlidingState, Tile, TileColors } from './types'

function copyColors(colors: TileColors): TileColors {
  return [
    [colors[0][0], colors[0][1]],
    [colors[1][0], colors[1][1]],
  ]
}

function copyTile(tile: Tile): Tile {
  return {
    id: tile.id,
    colors: copyColors(tile.colors),
  }
}

export function copyBoard(board: Board): Board {
  return board.map((tile) => (tile ? copyTile(tile) : null))
}

export function createSlidingState(board: Board): SlidingState {
  if (!isValidSlidingBoard(board)) {
    throw new Error('A sliding state requires 15 unique tiles and one empty slot.')
  }

  return { board: copyBoard(board) }
}

export function isSlidingState(value: unknown): value is SlidingState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<SlidingState>
  return Array.isArray(candidate.board) && isValidSlidingBoard(candidate.board)
}

function colorsEqual(first: TileColors, second: TileColors): boolean {
  return (
    first[0][0] === second[0][0] &&
    first[0][1] === second[0][1] &&
    first[1][0] === second[1][0] &&
    first[1][1] === second[1][1]
  )
}

export function slidingStatesEqual(
  first: SlidingState,
  second: SlidingState,
): boolean {
  if (first.board.length !== second.board.length) return false

  return first.board.every((tile, index) => {
    const other = second.board[index]
    if (tile === null || other === null) return tile === other
    return tile.id === other.id && colorsEqual(tile.colors, other.colors)
  })
}

export function haveSameTileCatalog(
  first: SlidingState,
  second: SlidingState,
): boolean {
  const firstTiles = new Map(
    first.board.flatMap((tile) => (tile ? [[tile.id, tile] as const] : [])),
  )
  const secondTiles = new Map(
    second.board.flatMap((tile) => (tile ? [[tile.id, tile] as const] : [])),
  )

  if (firstTiles.size !== secondTiles.size) return false
  return [...firstTiles].every(([tileId, tile]) => {
    const other = secondTiles.get(tileId)
    return Boolean(other && colorsEqual(tile.colors, other.colors))
  })
}

/**
 * Compact arrangement key used for solver visited-state deduplication.
 * Tile patterns are deliberately omitted because they do not change while
 * sliding. Length-prefixing prevents delimiter-shaped tile IDs from colliding.
 */
export function getSlidingStateKey(state: SlidingState): string {
  return state.board
    .map((tile) => (tile ? `T${tile.id.length}:${tile.id}` : 'E'))
    .join('|')
}

/**
 * Exact puzzle identity used to associate asynchronous solver results. The
 * catalog is included because draft tile IDs repeat across games and placement
 * rotation can give the same ID a different immutable color pattern.
 */
export function getSlidingPuzzleKey(state: SlidingState): string {
  const catalog = state.board
    .flatMap((tile) => (tile ? [tile] : []))
    .sort((first, second) =>
      first.id < second.id ? -1 : first.id > second.id ? 1 : 0,
    )
    .map(
      (tile) =>
        `${tile.id.length}:${tile.id}:${tile.colors[0].join('')}${tile.colors[1].join('')}`,
    )
    .join('|')

  return `${catalog}#${getSlidingStateKey(state)}`
}
