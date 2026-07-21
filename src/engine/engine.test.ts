import { describe, expect, it } from 'vitest'
import * as engine from './index'
import {
  Board,
  Color,
  GameState,
  Tile,
  canSlide,
  countTiles,
  createDraftQueue,
  createInitialState,
  expandBoardToMiniGrid,
  finalScore,
  getEmptySlotIndices,
  largestConnectedRegion,
  placeSelectedTile,
  rotateSelectedDraftTile,
  rotateTile,
  scoreByColor,
  selectDraftTile,
  slideTile,
} from './index'

function makeTile(
  id: string,
  colors: [[Color, Color], [Color, Color]] = [
    ['R', 'Y'],
    ['G', 'B'],
  ],
): Tile {
  return { id, colors }
}

function makeSlidingBoard(emptyIndex = 15): Board {
  return Array.from({ length: 16 }, (_, index) =>
    index === emptyIndex ? null : makeTile(`tile-${index}`),
  )
}

function makeSlidingState(board = makeSlidingBoard()): GameState {
  return {
    phase: 'sliding',
    seed: 1,
    board,
    visibleTiles: [],
    drawPile: [],
    selectedDraftIndex: null,
    selectedRotation: 0,
    slidesRemaining: 5,
    message: 'Sliding phase.',
  }
}

describe('fixed tile and board model', () => {
  it('creates a valid sliding game with 15 tiles and one empty slot', () => {
    let state = createInitialState(42)

    for (let slotIndex = 0; slotIndex < 15; slotIndex += 1) {
      state = selectDraftTile(state, 0)
      state = placeSelectedTile(state, slotIndex)
    }

    expect(state.phase).toBe('sliding')
    expect(countTiles(state.board)).toBe(15)
    expect(getEmptySlotIndices(state.board)).toEqual([15])
  })

  it('gives every tile exactly four colors in a 2 by 2 pattern', () => {
    const tiles = createDraftQueue(7)

    for (const tile of tiles) {
      expect(tile.colors).toHaveLength(2)
      expect(tile.colors[0]).toHaveLength(2)
      expect(tile.colors[1]).toHaveLength(2)
      expect(tile.colors.flat()).toHaveLength(4)
    }
  })
})

describe('placement-only tile rotation', () => {
  it('rotates the selected color pattern and locks that orientation on placement', () => {
    const initial = createInitialState(12)
    const draftTile = initial.visibleTiles[0]
    const selected = selectDraftTile(initial, 0)
    const rotated = rotateSelectedDraftTile(selected, 'clockwise')
    const placed = placeSelectedTile(rotated, 0)

    expect(rotated.selectedRotation).toBe(1)
    expect(rotated.visibleTiles[0]).toBe(draftTile)
    expect(placed.board[0]).toEqual(rotateTile(draftTile, 1))
    expect(placed.selectedRotation).toBe(0)
  })

  it('does not mutate the previous state when rotating a draft tile', () => {
    const selected = selectDraftTile(createInitialState(8), 0)
    const snapshot = structuredClone(selected)
    const rotated = rotateSelectedDraftTile(selected, 'counterclockwise')

    expect(rotated).not.toBe(selected)
    expect(rotated.selectedRotation).toBe(3)
    expect(selected).toEqual(snapshot)
  })

  it('keeps a placed tile locked during the rest of placement', () => {
    const selected = selectDraftTile(createInitialState(4), 0)
    const placed = placeSelectedTile(
      rotateSelectedDraftTile(selected, 'clockwise'),
      0,
    )
    const lockedTile = placed.board[0]

    expect(rotateSelectedDraftTile(placed, 'clockwise')).toBe(placed)
    expect(canSlide(placed, lockedTile!.id)).toBe(false)
    expect(slideTile(placed, lockedTile!.id)).toBe(placed)

    const nextDraft = selectDraftTile(placed, 0)
    const nextRotated = rotateSelectedDraftTile(nextDraft, 'clockwise')
    expect(nextRotated.board[0]).toBe(lockedTile)
  })

  it('rejects rotation during the sliding phase', () => {
    const sliding = makeSlidingState()

    expect(rotateSelectedDraftTile(sliding, 'clockwise')).toBe(sliding)
  })
})

describe('15-puzzle movement', () => {
  it('allows a tile orthogonally adjacent to the empty slot to slide', () => {
    expect(canSlide(makeSlidingState(), 'tile-14')).toBe(true)
  })

  it('rejects a diagonal tile', () => {
    expect(canSlide(makeSlidingState(), 'tile-10')).toBe(false)
  })

  it('rejects a non-adjacent tile', () => {
    expect(canSlide(makeSlidingState(), 'tile-0')).toBe(false)
  })

  it('swaps the sliding tile with the empty slot', () => {
    const state = makeSlidingState()
    const next = slideTile(state, 'tile-14')

    expect(next.board[15]?.id).toBe('tile-14')
    expect(next.board[14]).toBeNull()
  })

  it('does not mutate the previous state', () => {
    const state = makeSlidingState()
    const snapshot = structuredClone(state)
    const next = slideTile(state, 'tile-14')

    expect(next).not.toBe(state)
    expect(state).toEqual(snapshot)
  })

  it('updates the empty slot correctly after consecutive moves', () => {
    const firstMove = slideTile(makeSlidingState(), 'tile-14')
    const secondMove = slideTile(firstMove, 'tile-10')

    expect(getEmptySlotIndices(firstMove.board)).toEqual([14])
    expect(getEmptySlotIndices(secondMove.board)).toEqual([10])
    expect(secondMove.board[14]?.id).toBe('tile-10')
  })
})

describe('8 by 8 mini-cell scoring', () => {
  it('expands each large board slot into the correct 2 by 2 mini-cells', () => {
    const board: Board = [
      makeTile('pattern', [
        ['R', 'Y'],
        ['G', 'B'],
      ]),
      ...Array<Tile | null>(15).fill(null),
    ]
    const grid = expandBoardToMiniGrid(board)

    expect(grid).toHaveLength(8)
    expect(grid.every((row) => row.length === 8)).toBe(true)
    expect(grid[0].slice(0, 2)).toEqual(['R', 'Y'])
    expect(grid[1].slice(0, 2)).toEqual(['G', 'B'])
    expect(grid[0][2]).toBeNull()
  })

  it('connects matching mini-cells across neighboring tile boundaries', () => {
    const board: Board = [
      makeTile('left', [
        ['B', 'R'],
        ['B', 'R'],
      ]),
      makeTile('right', [
        ['R', 'Y'],
        ['R', 'Y'],
      ]),
      ...Array<Tile | null>(14).fill(null),
    ]

    expect(scoreByColor(board).R).toBe(4)
  })

  it('calculates the largest connected region for a color', () => {
    const grid = Array.from({ length: 8 }, () =>
      Array<Color | null>(8).fill(null),
    )
    grid[0][0] = 'R'
    grid[0][1] = 'R'
    grid[1][1] = 'R'
    grid[6][6] = 'R'
    grid[6][7] = 'R'

    expect(largestConnectedRegion(grid, 'R')).toBe(3)
  })

  it('uses the two largest per-color region scores for the final score', () => {
    const board: Board = [
      makeTile('red', [
        ['R', 'R'],
        ['R', 'R'],
      ]),
      ...Array<Tile | null>(14).fill(null),
      makeTile('green', [
        ['G', 'G'],
        ['G', 'G'],
      ]),
    ]

    expect(scoreByColor(board)).toEqual({ R: 4, Y: 0, G: 4, B: 0 })
    expect(finalScore(board)).toBe(8)
  })
})

describe('obsolete model removal', () => {
  it('does not expose arbitrary-shape rotation or polyomino placement APIs', () => {
    const tile = createDraftQueue(1, 1)[0]

    expect(Object.keys(tile).sort()).toEqual(['colors', 'id'])
    expect(engine).not.toHaveProperty('rotateCells')
    expect(engine).not.toHaveProperty('occupiedCells')
    expect(engine).not.toHaveProperty('canPlace')
  })
})
