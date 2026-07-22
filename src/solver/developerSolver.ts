import {
  SlidingState,
  SolverMove,
  analyzeBoard,
  applyMove,
  createSlidingState,
  getLegalMoves,
  getSlidingPuzzleKey,
  getSlidingStateKey,
  isSlidingState,
} from '../engine'
import { evaluateHeuristic } from './heuristic'
import {
  DeveloperSolverOptions,
  DeveloperSolverResult,
  ResolvedDeveloperSolverOptions,
} from './types'
import { verifySolverResult } from './verifySolution'

export const DEFAULT_DEVELOPER_SOLVER_OPTIONS: ResolvedDeveloperSolverOptions =
  {
    timeBudgetMs: 500,
    maxStates: 12_000,
    beamWidth: 96,
    maxSearchDepth: 80,
    seed: 20260721,
  }

interface SearchNode {
  readonly state: SlidingState
  readonly stateKey: string
  readonly score: number
  readonly rank: number
  readonly moves: readonly SolverMove[]
  readonly lastMovedTileId: string | null
}

function resolveOptions(
  options: DeveloperSolverOptions = {},
): ResolvedDeveloperSolverOptions {
  return {
    timeBudgetMs: Math.max(
      1,
      options.timeBudgetMs ?? DEFAULT_DEVELOPER_SOLVER_OPTIONS.timeBudgetMs,
    ),
    maxStates: Math.max(
      1,
      Math.floor(options.maxStates ?? DEFAULT_DEVELOPER_SOLVER_OPTIONS.maxStates),
    ),
    beamWidth: Math.max(
      1,
      Math.floor(options.beamWidth ?? DEFAULT_DEVELOPER_SOLVER_OPTIONS.beamWidth),
    ),
    maxSearchDepth: Math.max(
      1,
      Math.floor(
        options.maxSearchDepth ??
          DEFAULT_DEVELOPER_SOLVER_OPTIONS.maxSearchDepth,
      ),
    ),
    seed: Math.floor(options.seed ?? DEFAULT_DEVELOPER_SOLVER_OPTIONS.seed),
  }
}

function now(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now()
}

export function runDeveloperSolver(
  providedInitialState: SlidingState,
  providedOptions: DeveloperSolverOptions = {},
): DeveloperSolverResult {
  if (!isSlidingState(providedInitialState)) {
    throw new Error('Developer Solver requires a valid canonical sliding state.')
  }

  const options = resolveOptions(providedOptions)
  const initialState = createSlidingState(providedInitialState.board)
  const initialStateKey = getSlidingPuzzleKey(initialState)
  const arrangementKey = getSlidingStateKey(initialState)
  const initialAnalysis = analyzeBoard(initialState.board)
  const initialHeuristic = evaluateHeuristic(
    initialState,
    arrangementKey,
    options.seed,
    initialAnalysis,
  )
  const initialNode: SearchNode = {
    state: initialState,
    stateKey: arrangementKey,
    score: initialAnalysis.totalScore,
    rank: initialHeuristic.rank,
    moves: [],
    lastMovedTileId: null,
  }
  const startedAt = now()
  const visited = new Set([arrangementKey])
  let searchedStates = 1
  let frontier: SearchNode[] = [initialNode]
  let bestNode = initialNode
  let searchBudgetReached = false
  let searchCompleted = false

  function budgetReached(): boolean {
    return (
      searchedStates >= options.maxStates ||
      now() - startedAt >= options.timeBudgetMs
    )
  }

  searchLoop: for (
    let depth = 1;
    depth <= options.maxSearchDepth;
    depth += 1
  ) {
    if (budgetReached()) {
      searchBudgetReached = true
      break
    }

    const candidates: SearchNode[] = []
    for (const node of frontier) {
      for (const move of getLegalMoves(node.state)) {
        // Moving the same tile again is the immediate reverse of the last move.
        if (move.tileId === node.lastMovedTileId) continue

        const nextState = applyMove(node.state, move)
        const stateKey = getSlidingStateKey(nextState)
        if (visited.has(stateKey)) continue
        visited.add(stateKey)
        searchedStates += 1

        const analysis = analyzeBoard(nextState.board)
        const heuristic = evaluateHeuristic(
          nextState,
          stateKey,
          options.seed,
          analysis,
        )
        const candidate: SearchNode = {
          state: nextState,
          stateKey,
          score: analysis.totalScore,
          rank: heuristic.rank,
          moves: [...node.moves, move],
          lastMovedTileId: move.tileId,
        }
        candidates.push(candidate)

        if (
          candidate.score > bestNode.score ||
          (candidate.score === bestNode.score &&
            (candidate.moves.length < bestNode.moves.length ||
              (candidate.moves.length === bestNode.moves.length &&
                candidate.stateKey < bestNode.stateKey)))
        ) {
          bestNode = candidate
        }

        if (budgetReached()) {
          searchBudgetReached = true
          break searchLoop
        }
      }
    }

    if (candidates.length === 0) {
      searchCompleted = true
      break
    }

    candidates.sort(
      (first, second) =>
        second.rank - first.rank ||
        second.score - first.score ||
        (first.stateKey < second.stateKey
          ? -1
          : first.stateKey > second.stateKey
            ? 1
            : 0),
    )
    frontier = candidates.slice(0, options.beamWidth)
    if (depth === options.maxSearchDepth) searchCompleted = true
  }

  const verification = verifySolverResult(
    initialState,
    bestNode.moves,
    bestNode.state,
    bestNode.score,
  )

  return {
    initialStateKey,
    initialScore: initialNode.score,
    bestScoreFound: bestNode.score,
    bestState: bestNode.state,
    moves: bestNode.moves,
    searchedStates,
    elapsedMs: now() - startedAt,
    verifiedReachable: verification.valid,
    searchBudgetReached,
    searchCompleted,
    options,
  }
}
