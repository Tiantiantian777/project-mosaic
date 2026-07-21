import {
  areOrthogonallyAdjacent,
  getSingleEmptySlot,
  getTileIndex,
} from './board'
import { GameState } from './types'

export function canSlide(state: GameState, tileId: string): boolean {
  if (state.phase !== 'sliding') return false

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

  return {
    ...state,
    board: nextBoard,
    message: `${tileId} slid into the empty slot.`,
  }
}
