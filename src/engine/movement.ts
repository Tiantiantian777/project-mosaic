import { applyMove, getLegalMoves } from './moves'
import { GameState } from './types'

export function canSlide(state: GameState, tileId: string): boolean {
  if (state.phase !== 'sliding') return false
  return getLegalMoves({ board: state.board }).some(
    (move) => move.tileId === tileId,
  )
}

export function slideTile(state: GameState, tileId: string): GameState {
  if (state.phase !== 'sliding') return state
  const slidingState = { board: state.board }
  const move = getLegalMoves(slidingState).find(
    (candidate) => candidate.tileId === tileId,
  )
  if (!move) return state
  const nextSlidingState = applyMove(slidingState, move)

  return {
    ...state,
    board: nextSlidingState.board,
    message: `${tileId} slid into the empty slot.`,
  }
}
