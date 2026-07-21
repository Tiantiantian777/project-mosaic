import {
  areOrthogonallyAdjacent,
  getSingleEmptySlot,
  getTileIndex,
} from './board'
import { GameState } from './types'

export function canSlide(state: GameState, tileId: string): boolean {
  if (state.phase !== 'sliding' || state.slidesRemaining <= 0) return false

  const emptySlot = getSingleEmptySlot(state.board)
  const tileIndex = getTileIndex(state.board, tileId)
  return (
    emptySlot !== null &&
    tileIndex >= 0 &&
    areOrthogonallyAdjacent(tileIndex, emptySlot)
  )
}

export function slideTile(state: GameState, tileId: string): GameState {
  if (!canSlide(state, tileId)) return state

  const emptySlot = getSingleEmptySlot(state.board)!
  const tileIndex = getTileIndex(state.board, tileId)
  const nextBoard = [...state.board]
  nextBoard[emptySlot] = state.board[tileIndex]
  nextBoard[tileIndex] = null

  const slidesRemaining = state.slidesRemaining - 1
  const finished = slidesRemaining === 0

  return {
    ...state,
    board: nextBoard,
    slidesRemaining,
    phase: finished ? 'finished' : 'sliding',
    message: finished
      ? 'No slides remain. Your mosaic is complete.'
      : `${tileId} slid into the empty slot.`,
  }
}
