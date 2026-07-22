import { SlidingState, SolverMove } from '../engine'

export interface DeveloperSolverOptions {
  readonly timeBudgetMs?: number
  readonly maxStates?: number
  readonly beamWidth?: number
  readonly maxSearchDepth?: number
  readonly seed?: number
}

export interface ResolvedDeveloperSolverOptions {
  readonly timeBudgetMs: number
  readonly maxStates: number
  readonly beamWidth: number
  readonly maxSearchDepth: number
  readonly seed: number
}

export interface DeveloperSolverResult {
  readonly initialStateKey: string
  readonly initialScore: number
  readonly bestScoreFound: number
  readonly bestState: SlidingState
  readonly moves: readonly SolverMove[]
  readonly searchedStates: number
  readonly elapsedMs: number
  readonly verifiedReachable: boolean
  readonly searchBudgetReached: boolean
  /**
   * True only when this configured beam-search procedure reached its depth or
   * frontier end without hitting a state/time budget. It never means the full
   * reachable state space was exhausted or that the score is globally optimal.
   */
  readonly searchCompleted: boolean
  readonly options: ResolvedDeveloperSolverOptions
}

export interface VerificationResult {
  readonly valid: boolean
  readonly finalStateMatches: boolean
  readonly finalScoreMatches: boolean
  readonly replayedScore: number
  readonly failureReason?: string
}

export type SolverWorkerRequest = {
  readonly type: 'solve'
  readonly initialState: SlidingState
  readonly options?: DeveloperSolverOptions
}

export type SolverWorkerResponse =
  | {
      readonly type: 'result'
      readonly result: DeveloperSolverResult
    }
  | {
      readonly type: 'error'
      readonly message: string
    }
