import { expect, it } from 'vitest'
import { completeSeededPlacement } from '../testing/solverFixtures'
import {
  DEFAULT_DEVELOPER_SOLVER_OPTIONS,
  runDeveloperSolver,
} from './developerSolver'
import { DeveloperSolverOptions } from './types'
import { verifyDeveloperSolverResult } from './verifySolution'

const CONFIGURATIONS: ReadonlyArray<{
  name: string
  options: DeveloperSolverOptions
}> = [
  {
    name: 'quick',
    options: {
      timeBudgetMs: 100,
      maxStates: 500,
      beamWidth: 16,
      maxSearchDepth: 30,
      seed: 7,
    },
  },
  {
    name: 'balanced',
    options: {
      timeBudgetMs: 250,
      maxStates: 4_000,
      beamWidth: 48,
      maxSearchDepth: 60,
      seed: 7,
    },
  },
  {
    name: 'app-default',
    options: { ...DEFAULT_DEVELOPER_SOLVER_OPTIONS, seed: 7 },
  },
]

it(
  'reports realistic Developer Solver benchmark results',
  () => {
    const rows = [42, 20260719, 811].flatMap((puzzleSeed) => {
      const initialState = completeSeededPlacement(puzzleSeed)
      return CONFIGURATIONS.map(({ name, options }) => {
        const result = runDeveloperSolver(initialState, options)
        const verification = verifyDeveloperSolverResult(initialState, result)
        return {
          puzzleSeed,
          configuration: name,
          timeBudgetMs: options.timeBudgetMs,
          beamWidth: options.beamWidth,
          statesExplored: result.searchedStates,
          initialScore: result.initialScore,
          bestScoreFound: result.bestScoreFound,
          pathLength: result.moves.length,
          verified: verification.valid,
          elapsedMs: Number(result.elapsedMs.toFixed(1)),
          budgetReached: result.searchBudgetReached,
        }
      })
    })

    console.table(rows)
    expect(rows).toHaveLength(9)
    expect(rows.every((row) => row.verified)).toBe(true)
    expect(rows.every((row) => row.statesExplored >= 1)).toBe(true)
  },
  20_000,
)
