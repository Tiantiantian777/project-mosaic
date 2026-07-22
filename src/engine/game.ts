import { countTiles, createEmptyBoard, isTile, placeTileInSlot } from './board'
import { dealInitialDraft } from './draft'
import { rotateTile } from './rotation'
import {
  createSlidingState,
  haveSameTileCatalog,
  isSlidingState,
} from './slidingState'
import {
  BOARD_SLOT_COUNT,
  GameState,
  RotationDirection,
  TileRotation,
} from './types'

export function createInitialState(seed: number): GameState {
  const { visibleTiles, drawPile } = dealInitialDraft(seed)
  return {
    phase: 'placement',
    seed,
    board: createEmptyBoard(),
    visibleTiles,
    drawPile,
    selectedDraftIndex: null,
    selectedRotation: 0,
    slidingInitialState: null,
    message: 'Choose one of the three tiles, then choose a board slot.',
  }
}

export function createNextGameSeed(
  currentSeed: number,
  entropy: number,
): number {
  const mixed = Math.imul(
    (currentSeed ^ entropy ^ 0x9e3779b9) >>> 0,
    0x85ebca6b,
  ) >>> 0
  return mixed === (currentSeed >>> 0) ? (mixed + 1) >>> 0 : mixed
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
    selectedRotation:
      state.selectedDraftIndex === draftIndex ? state.selectedRotation : 0,
    message: `${state.visibleTiles[draftIndex].id} selected. Rotate it if desired, then choose an empty large slot.`,
  }
}

export function rotateSelectedDraftTile(
  state: GameState,
  direction: RotationDirection,
): GameState {
  if (state.phase !== 'placement' || state.selectedDraftIndex === null) {
    return state
  }

  const delta = direction === 'clockwise' ? 1 : -1
  const selectedRotation = ((state.selectedRotation + delta + 4) %
    4) as TileRotation
  const selectedTile = state.visibleTiles[state.selectedDraftIndex]
  if (!selectedTile) return state

  return {
    ...state,
    selectedRotation,
    message: `${selectedTile.id} rotated ${direction}. Its orientation locks when placed.`,
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

  const draftTile = state.visibleTiles[state.selectedDraftIndex]
  if (!draftTile) return state
  const selectedTile = rotateTile(draftTile, state.selectedRotation)

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
    selectedRotation: 0,
    slidingInitialState: enteringSlidingPhase
      ? createSlidingState(board)
      : state.slidingInitialState,
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
    message: 'Mosaic submitted.',
  }
}

export function resumeGame(state: GameState): GameState {
  if (state.phase !== 'finished') return state
  return {
    ...state,
    phase: 'sliding',
    message: 'Keep trying: slide any glowing tile into the empty slot.',
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
    ![0, 1, 2, 3].includes(Number(candidate.selectedRotation)) ||
    !('slidingInitialState' in candidate) ||
    typeof candidate.message !== 'string'
  ) {
    return false
  }

  const placedTiles = countTiles(candidate.board)
  if (candidate.phase === 'placement') {
    return placedTiles < 15 && candidate.slidingInitialState === null
  }

  const currentSlidingState = { board: candidate.board }
  if (
    placedTiles !== 15 ||
    !isSlidingState(currentSlidingState) ||
    !isSlidingState(candidate.slidingInitialState)
  ) {
    return false
  }

  return haveSameTileCatalog(
    currentSlidingState,
    candidate.slidingInitialState,
  )
}
