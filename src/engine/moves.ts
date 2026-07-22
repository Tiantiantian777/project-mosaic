import {
  areOrthogonallyAdjacent,
  getSingleEmptySlot,
  getTileIndex,
  isValidSlidingBoard,
  toBoardCoordinates,
} from './board'
import {
  SlideDirection,
  SlidingState,
  SolverMove,
} from './types'

function getDirection(fromIndex: number, toIndex: number): SlideDirection {
  const from = toBoardCoordinates(fromIndex)
  const to = toBoardCoordinates(toIndex)

  if (to.row < from.row) return 'up'
  if (to.row > from.row) return 'down'
  if (to.column < from.column) return 'left'
  return 'right'
}

export function getLegalMoves(state: SlidingState): SolverMove[] {
  if (!isValidSlidingBoard(state.board)) return []
  const emptyIndex = getSingleEmptySlot(state.board)
  if (emptyIndex === null) return []

  return state.board.flatMap((tile, fromIndex) => {
    if (!tile || !areOrthogonallyAdjacent(fromIndex, emptyIndex)) return []
    return [
      {
        tileId: tile.id,
        fromIndex,
        toIndex: emptyIndex,
        direction: getDirection(fromIndex, emptyIndex),
      },
    ]
  })
}

export function isLegalMove(
  state: SlidingState,
  move: SolverMove,
): boolean {
  const tileIndex = getTileIndex(state.board, move.tileId)
  const emptyIndex = getSingleEmptySlot(state.board)
  if (tileIndex < 0 || emptyIndex === null) return false

  return getLegalMoves(state).some(
    (legalMove) =>
      legalMove.tileId === move.tileId &&
      legalMove.fromIndex === move.fromIndex &&
      legalMove.toIndex === move.toIndex &&
      legalMove.direction === move.direction,
  )
}

export function applyMove(
  state: SlidingState,
  move: SolverMove,
): SlidingState {
  if (!isLegalMove(state, move)) return state

  const nextBoard = [...state.board]
  nextBoard[move.toIndex] = state.board[move.fromIndex]
  nextBoard[move.fromIndex] = null
  return { board: nextBoard }
}
