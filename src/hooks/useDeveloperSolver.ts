import { useEffect, useState } from 'react'
import { SlidingState, getSlidingPuzzleKey } from '../engine'
import {
  acceptDeveloperSolverResult,
  createEmptyDeveloperSolverSession,
  createRunningDeveloperSolverSession,
  DEFAULT_DEVELOPER_SOLVER_OPTIONS,
  DeveloperSolverSession,
  SolverWorkerResponse,
} from '../solver'

export function useDeveloperSolver(
  initialState: SlidingState | null,
): DeveloperSolverSession {
  const [session, setSession] = useState<DeveloperSolverSession>(
    createEmptyDeveloperSolverSession,
  )

  useEffect(() => {
    if (!initialState) {
      setSession(createEmptyDeveloperSolverSession())
      return
    }

    const puzzleKey = getSlidingPuzzleKey(initialState)
    if (typeof Worker === 'undefined') {
      setSession({ status: 'unavailable', puzzleKey, result: null })
      return
    }

    let active = true
    const worker = new Worker(
      new URL('../solver/developerSolver.worker.ts', import.meta.url),
      { type: 'module' },
    )
    setSession(createRunningDeveloperSolverSession(initialState))

    worker.onmessage = (event: MessageEvent<SolverWorkerResponse>) => {
      if (!active) return
      if (event.data.type === 'error') {
        console.warn('[Developer Solver]', event.data.message)
        setSession({ status: 'error', puzzleKey, result: null })
        return
      }

      const result = event.data.result
      const accepted = acceptDeveloperSolverResult(initialState, result)
      if (accepted.session.status !== 'ready') {
        console.warn('[Developer Solver] Verification failed.', {
          puzzleKey,
          failureReason: accepted.verification.failureReason,
        })
        setSession(accepted.session)
        return
      }

      if (import.meta.env.DEV) {
        console.info('[Developer Solver]', {
          initialStateKey: result.initialStateKey,
          initialScore: result.initialScore,
          bestScoreFound: result.bestScoreFound,
          searchedStates: result.searchedStates,
          elapsedMs: result.elapsedMs,
          moveSequenceLength: result.moves.length,
          verifiedReachable: result.verifiedReachable,
          searchBudgetReached: result.searchBudgetReached,
          searchCompleted: result.searchCompleted,
          options: result.options,
        })
      }

      setSession(accepted.session)
    }

    worker.postMessage({
      type: 'solve',
      initialState,
      options: DEFAULT_DEVELOPER_SOLVER_OPTIONS,
    })

    return () => {
      active = false
      worker.terminate()
    }
  }, [initialState])

  return session
}
