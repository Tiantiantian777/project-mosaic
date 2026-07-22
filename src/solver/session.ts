import { SlidingState, getSlidingPuzzleKey } from '../engine'
import { DeveloperSolverResult, VerificationResult } from './types'
import { verifyDeveloperSolverResult } from './verifySolution'

export type DeveloperSolverStatus =
  | 'idle'
  | 'running'
  | 'ready'
  | 'invalid'
  | 'unavailable'
  | 'error'

export interface DeveloperSolverSession {
  readonly status: DeveloperSolverStatus
  readonly puzzleKey: string | null
  readonly result: DeveloperSolverResult | null
}

export function createEmptyDeveloperSolverSession(): DeveloperSolverSession {
  return { status: 'idle', puzzleKey: null, result: null }
}

export function createRunningDeveloperSolverSession(
  initialState: SlidingState,
): DeveloperSolverSession {
  return {
    status: 'running',
    puzzleKey: getSlidingPuzzleKey(initialState),
    result: null,
  }
}

export function acceptDeveloperSolverResult(
  initialState: SlidingState,
  result: DeveloperSolverResult,
): {
  session: DeveloperSolverSession
  verification: VerificationResult
} {
  const puzzleKey = getSlidingPuzzleKey(initialState)
  const verification = verifyDeveloperSolverResult(initialState, result)
  const accepted = result.verifiedReachable && verification.valid

  return {
    session: {
      status: accepted ? 'ready' : 'invalid',
      puzzleKey,
      result: accepted ? result : null,
    },
    verification,
  }
}
