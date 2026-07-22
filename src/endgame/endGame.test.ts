import { describe, expect, it } from 'vitest'
import {
  createInitialState,
  createNextGameSeed,
  finishGame,
  getLegalMoves,
  resumeGame,
  slideTile,
} from '../engine'
import {
  acceptDeveloperSolverResult,
  createEmptyDeveloperSolverSession,
  runDeveloperSolver,
} from '../solver'
import {
  makeImprovedFixtureState,
  makeImprovementFixture,
  makeSlidingGameState,
} from '../testing/solverFixtures'
import { createEndGameSummary } from './endGame'

const SOLVER_OPTIONS = {
  timeBudgetMs: 5_000,
  maxStates: 300,
  beamWidth: 24,
  maxSearchDepth: 10,
  seed: 11,
} as const

describe('truthful end-game display rules', () => {
  it('shows a higher numeric target only for a verified reachable result', () => {
    const initial = makeImprovementFixture()
    const result = runDeveloperSolver(initial, SOLVER_OPTIONS)
    const summary = createEndGameSummary(initial, initial, result)

    expect(summary.kind).toBe('reachable-higher')
    expect(summary.reachableScore).toBe(result.bestScoreFound)

    const tampered = {
      ...result,
      bestScoreFound: result.bestScoreFound + 1,
    }
    expect(createEndGameSummary(initial, initial, tampered)).toEqual({
      kind: 'fallback',
      playerScore: 56,
    })
  })

  it('uses a safe fallback when no verified result exists', () => {
    const initial = makeImprovementFixture()

    expect(createEndGameSummary(initial, initial, null)).toEqual({
      kind: 'fallback',
      playerScore: 56,
    })
  })

  it('treats an equal score as best found rather than globally optimal', () => {
    const initial = makeImprovementFixture()
    const result = runDeveloperSolver(initial, SOLVER_OPTIONS)
    const summary = createEndGameSummary(result.bestState, initial, result)

    expect(summary.kind).toBe('matches-best-found')
    expect(summary.playerScore).toBe(result.bestScoreFound)
  })

  it('handles a player score above a smaller verified solver result', () => {
    const initial = makeImprovementFixture()
    const initialOnlyResult = runDeveloperSolver(initial, {
      ...SOLVER_OPTIONS,
      maxStates: 1,
    })
    const improved = makeImprovedFixtureState()
    const summary = createEndGameSummary(
      improved,
      initial,
      initialOnlyResult,
    )

    expect(summary.kind).toBe('player-beat-solver')
    expect(summary.playerScore).toBeGreaterThan(
      initialOnlyResult.bestScoreFound,
    )
  })

  it('does not show a solver result from an old game', () => {
    const initial = makeImprovementFixture()
    const result = runDeveloperSolver(initial, SOLVER_OPTIONS)
    const otherGame = structuredClone(initial)
    const changedBoard = [...otherGame.board]
    const tile = changedBoard[0]!
    changedBoard[0] = {
      ...tile,
      colors: [
        ['G', 'G'],
        ['G', 'G'],
      ],
    }

    expect(
      createEndGameSummary(
        { board: changedBoard },
        { board: changedBoard },
        result,
      ).kind,
    ).toBe('fallback')
  })
})

describe('repeatable Submit lifecycle', () => {
  it('Keep Trying restores the same submitted board', () => {
    const sliding = makeSlidingGameState()
    const submitted = finishGame(sliding)
    const resumed = resumeGame(submitted)

    expect(resumed.phase).toBe('sliding')
    expect(resumed.board).toBe(submitted.board)
    expect(resumed.slidingInitialState).toBe(submitted.slidingInitialState)
  })

  it('allows another legal slide and Submit after Keep Trying', () => {
    const submitted = finishGame(makeSlidingGameState())
    const resumed = resumeGame(submitted)
    const move = getLegalMoves({ board: resumed.board })[0]
    const moved = slideTile(resumed, move.tileId)
    const submittedAgain = finishGame(moved)

    expect(moved.phase).toBe('sliding')
    expect(submittedAgain.phase).toBe('finished')
  })

  it('New Game creates a different seed and clears puzzle-specific state', () => {
    const previous = makeSlidingGameState()
    const solverResult = runDeveloperSolver(
      previous.slidingInitialState!,
      SOLVER_OPTIONS,
    )
    const readySession = acceptDeveloperSolverResult(
      previous.slidingInitialState!,
      solverResult,
    ).session
    const nextSeed = createNextGameSeed(previous.seed, 123456)
    const next = createInitialState(nextSeed)
    const clearedSession = createEmptyDeveloperSolverSession()

    expect(readySession.status).toBe('ready')
    expect(next.seed).not.toBe(previous.seed)
    expect(next.phase).toBe('placement')
    expect(next.slidingInitialState).toBeNull()
    expect(next.board.every((tile) => tile === null)).toBe(true)
    expect(clearedSession).toEqual({
      status: 'idle',
      puzzleKey: null,
      result: null,
    })
  })
})
