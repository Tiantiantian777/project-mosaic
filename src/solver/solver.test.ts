import { describe, expect, it } from 'vitest'
import {
  SolverMove,
  analyzeBoard,
  applyMove,
  getLegalMoves,
  getSlidingPuzzleKey,
  getSlidingStateKey,
  isLegalMove,
  slidingStatesEqual,
} from '../engine'
import {
  makeImprovementFixture,
  makeImprovedFixtureState,
} from '../testing/solverFixtures'
import { runDeveloperSolver } from './developerSolver'
import {
  verifyDeveloperSolverResult,
  verifySolverResult,
} from './verifySolution'

const TEST_OPTIONS = {
  timeBudgetMs: 5_000,
  maxStates: 400,
  beamWidth: 32,
  maxSearchDepth: 12,
  seed: 17,
} as const

describe('canonical sliding state', () => {
  it('uses the same canonical score as normal gameplay', () => {
    const state = makeImprovementFixture()
    const analysis = analyzeBoard(state.board)

    expect(analysis.totalScore).toBe(56)
    expect(analysis.colorStats.R).toEqual({
      largestRegion: 4,
      componentSizes: [4, 4],
    })
    expect(analysis.colorStats.Y.largestRegion).toBe(52)
    expect(analysis.scoringColors).toEqual(['Y', 'R'])
  })

  it('only generates moves orthogonally adjacent to the empty slot', () => {
    const moves = getLegalMoves(makeImprovementFixture())

    expect(moves.map((move) => move.tileId).sort()).toEqual([
      'tile-11',
      'tile-14',
    ])
    expect(moves.every((move) => move.toIndex === 15)).toBe(true)
    expect(
      moves.find((move) => move.tileId === 'tile-14')?.direction,
    ).toBe('right')
  })

  it('applies a move and updates the empty position immutably', () => {
    const state = makeImprovementFixture()
    const snapshot = structuredClone(state)
    const move = getLegalMoves(state).find(
      (candidate) => candidate.tileId === 'tile-14',
    )!
    const next = applyMove(state, move)

    expect(next.board[14]).toBeNull()
    expect(next.board[15]?.id).toBe('tile-14')
    expect(state).toEqual(snapshot)
  })

  it('restores the original state when a move is followed by its reverse', () => {
    const state = makeImprovementFixture()
    const firstMove = getLegalMoves(state).find(
      (candidate) => candidate.tileId === 'tile-14',
    )!
    const moved = applyMove(state, firstMove)
    const reverse = getLegalMoves(moved).find(
      (candidate) => candidate.tileId === firstMove.tileId,
    )!

    expect(reverse.direction).toBe('left')
    expect(slidingStatesEqual(applyMove(moved, reverse), state)).toBe(true)
  })

  it('creates stable, arrangement-specific state keys', () => {
    const first = makeImprovementFixture()
    const identical = structuredClone(first)
    const different = makeImprovedFixtureState()

    expect(getSlidingStateKey(first)).toBe(getSlidingStateKey(identical))
    expect(getSlidingStateKey(first)).not.toBe(getSlidingStateKey(different))
  })
})

describe('Developer Solver', () => {
  it('returns a deterministic verified higher-scoring legal path', () => {
    const initialState = makeImprovementFixture()
    const first = runDeveloperSolver(initialState, TEST_OPTIONS)
    const second = runDeveloperSolver(initialState, TEST_OPTIONS)

    expect(first.bestScoreFound).toBeGreaterThan(first.initialScore)
    expect(first.verifiedReachable).toBe(true)
    expect(first.initialStateKey).toBe(getSlidingPuzzleKey(initialState))
    expect(first.bestScoreFound).toBe(second.bestScoreFound)
    expect(first.moves).toEqual(second.moves)
    expect(getSlidingStateKey(first.bestState)).toBe(
      getSlidingStateKey(second.bestState),
    )

    let replayed = initialState
    for (const move of first.moves) {
      expect(isLegalMove(replayed, move)).toBe(true)
      replayed = applyMove(replayed, move)
    }
    expect(slidingStatesEqual(replayed, first.bestState)).toBe(true)
    expect(analyzeBoard(replayed.board).totalScore).toBe(first.bestScoreFound)
  })

  it('does not mutate slidingInitialState', () => {
    const initialState = makeImprovementFixture()
    const snapshot = structuredClone(initialState)

    runDeveloperSolver(initialState, TEST_OPTIONS)

    expect(initialState).toEqual(snapshot)
  })

  it('rejects a modified or illegal replay path', () => {
    const initialState = makeImprovementFixture()
    const result = runDeveloperSolver(initialState, TEST_OPTIONS)
    const firstMove = result.moves[0]
    const illegalMove: SolverMove = {
      ...firstMove,
      toIndex: firstMove.toIndex === 0 ? 1 : 0,
    }
    const verification = verifySolverResult(
      initialState,
      [illegalMove, ...result.moves.slice(1)],
      result.bestState,
      result.bestScoreFound,
    )

    expect(verification.valid).toBe(false)
    expect(verification.failureReason).toContain('not legal')
  })

  it('rejects an incorrect claimed score', () => {
    const initialState = makeImprovementFixture()
    const result = runDeveloperSolver(initialState, TEST_OPTIONS)
    const verification = verifySolverResult(
      initialState,
      result.moves,
      result.bestState,
      result.bestScoreFound + 1,
    )

    expect(verification.valid).toBe(false)
    expect(verification.finalStateMatches).toBe(true)
    expect(verification.finalScoreMatches).toBe(false)
  })

  it('rejects a result associated with another initial puzzle key', () => {
    const initialState = makeImprovementFixture()
    const result = runDeveloperSolver(initialState, TEST_OPTIONS)
    const changedInitial = structuredClone(initialState)
    const firstTile = changedInitial.board.find((tile) => tile !== null)!
    const changedTile = {
      ...firstTile,
      colors: [
        ['B', 'B'],
        ['B', 'B'],
      ],
    } as const
    const tileIndex = changedInitial.board.indexOf(firstTile)
    const changedBoard = [...changedInitial.board]
    changedBoard[tileIndex] = changedTile

    const verification = verifyDeveloperSolverResult(
      { board: changedBoard },
      result,
    )

    expect(verification.valid).toBe(false)
    expect(verification.failureReason).toContain('different initial puzzle')
  })
})
