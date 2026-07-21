import { countTiles, createEmptyBoard, isTile, placeTileInSlot } from './board'
import { dealInitialDraft } from './draft'
import { BOARD_SLOT_COUNT, GameState, SLIDE_LIMIT } from './types'

export function createInitialState(seed: number): GameState {
  const { visibleTiles, drawPile } = dealInitialDraft(seed)
  return {
    phase: 'placement',
    seed,
    board: createEmptyBoard(),
    visibleTiles,
    drawPile,
    selectedDraftIndex: null,
    slidesRemaining: SLIDE_LIMIT,
    message: 'Choose one of the three tiles, then choose a board slot.',
  }
}

export function selectDraftTile(
  state: GameState,
  draftIndex: number,
): GameState {
  if (
    state.phase !== 'placement' ||
    draftIndex < 0 ||
    draftIndex >= state.visibleTiles.length
  ) {
    return state
  }

  return {
    ...state,
    selectedDraftIndex: draftIndex,
    message: `${state.visibleTiles[draftIndex].id} selected. Choose an empty large slot.`,
  }
}

export function placeSelectedTile(
  state: GameState,
  slotIndex: number,
): GameState {
  if (
    state.phase !== 'placement' ||
    state.selectedDraftIndex === null ||
    slotIndex < 0 ||
    slotIndex >= BOARD_SLOT_COUNT ||
    state.board[slotIndex] !== null
  ) {
    return state
  }

  const selectedTile = state.visibleTiles[state.selectedDraftIndex]
  if (!selectedTile) return state

  const board = placeTileInSlot(state.board, slotIndex, selectedTile)
  const placedTileCount = countTiles(board)
  const enteringSlidingPhase = placedTileCount === 15
  const visibleTiles = state.visibleTiles.filter(
    (_, index) => index !== state.selectedDraftIndex,
  )
  const drawPile = [...state.drawPile]

  if (!enteringSlidingPhase) {
    const replacement = drawPile.shift()
    if (replacement) visibleTiles.push(replacement)
  }

  return {
    ...state,
    board,
    visibleTiles: enteringSlidingPhase ? [] : visibleTiles,
    drawPile: enteringSlidingPhase ? [] : drawPile,
    selectedDraftIndex: null,
    phase: enteringSlidingPhase ? 'sliding' : 'placement',
    message: enteringSlidingPhase
      ? 'Sliding phase: tap or drag a tile next to the empty slot.'
      : `${selectedTile.id} placed. Choose another pattern.`,
  }
}

export function finishGame(state: GameState): GameState {
  if (state.phase !== 'sliding') return state
  return {
    ...state,
    phase: 'finished',
    message: 'Mosaic finished.',
  }
}

export function isPersistedGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<GameState>
  if (
    !['placement', 'sliding', 'finished'].includes(String(candidate.phase)) ||
    typeof candidate.seed !== 'number' ||
    !Array.isArray(candidate.board) ||
    candidate.board.length !== BOARD_SLOT_COUNT ||
    !candidate.board.every((tile) => tile === null || isTile(tile)) ||
    !Array.isArray(candidate.visibleTiles) ||
    !candidate.visibleTiles.every(isTile) ||
    !Array.isArray(candidate.drawPile) ||
    !candidate.drawPile.every(isTile) ||
    typeof candidate.slidesRemaining !== 'number' ||
    typeof candidate.message !== 'string'
  ) {
    return false
  }

  const placedTiles = countTiles(candidate.board)
  if (candidate.phase === 'placement') return placedTiles < 15
  return placedTiles === 15
}
