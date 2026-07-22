import {
  Board,
  GameState,
  SlidingState,
  Tile,
  applyMove,
  createInitialState,
  createSlidingState,
  getLegalMoves,
  placeSelectedTile,
  rotateSelectedDraftTile,
  selectDraftTile,
} from '../engine'

function solidTile(id: string, color: 'R' | 'Y'): Tile {
  return {
    id,
    colors: [
      [color, color],
      [color, color],
    ],
  }
}

/** A manually verifiable board where tile-14 moving right joins two red regions. */
export function makeImprovementFixture(): SlidingState {
  const board: Board = Array.from({ length: 16 }, (_, index) => {
    if (index === 15) return null
    return solidTile(
      `tile-${index}`,
      index === 11 || index === 14 ? 'R' : 'Y',
    )
  })
  return createSlidingState(board)
}

export function makeImprovedFixtureState(): SlidingState {
  const initialState = makeImprovementFixture()
  const move = getLegalMoves(initialState).find(
    (candidate) => candidate.tileId === 'tile-14',
  )
  if (!move) throw new Error('Improvement fixture is missing its expected move.')
  return applyMove(initialState, move)
}

export function makeSlidingGameState(
  slidingState = makeImprovementFixture(),
): GameState {
  return {
    phase: 'sliding',
    seed: 1,
    board: slidingState.board,
    visibleTiles: [],
    drawPile: [],
    selectedDraftIndex: null,
    selectedRotation: 0,
    slidingInitialState: createSlidingState(slidingState.board),
    message: 'Sliding phase.',
  }
}

export function completeSeededPlacement(seed: number): SlidingState {
  let game = createInitialState(seed)

  for (let slotIndex = 0; slotIndex < 15; slotIndex += 1) {
    const draftIndex = (seed + slotIndex) % game.visibleTiles.length
    game = selectDraftTile(game, draftIndex)
    const rotations = (seed + slotIndex) % 4
    for (let turn = 0; turn < rotations; turn += 1) {
      game = rotateSelectedDraftTile(game, 'clockwise')
    }
    game = placeSelectedTile(game, slotIndex)
  }

  if (!game.slidingInitialState) {
    throw new Error('Fixture placement did not enter the sliding phase.')
  }
  return game.slidingInitialState
}
