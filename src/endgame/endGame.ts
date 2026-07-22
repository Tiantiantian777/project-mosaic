import {
  SlidingState,
  analyzeBoard,
  haveSameTileCatalog,
  isSlidingState,
} from '../engine'
import {
  DeveloperSolverResult,
  verifyDeveloperSolverResult,
} from '../solver'

export type EndGameResultKind =
  | 'reachable-higher'
  | 'matches-best-found'
  | 'player-beat-solver'
  | 'fallback'

export interface EndGameSummaryModel {
  readonly kind: EndGameResultKind
  readonly playerScore: number
  readonly reachableScore?: number
}

export function createEndGameSummary(
  submittedState: SlidingState,
  slidingInitialState: SlidingState | null,
  solverResult: DeveloperSolverResult | null,
): EndGameSummaryModel {
  const playerScore = analyzeBoard(submittedState.board).totalScore
  const fallback: EndGameSummaryModel = { kind: 'fallback', playerScore }

  if (
    !slidingInitialState ||
    !solverResult ||
    !isSlidingState(submittedState) ||
    !haveSameTileCatalog(submittedState, slidingInitialState) ||
    !solverResult.verifiedReachable
  ) {
    return fallback
  }

  const verification = verifyDeveloperSolverResult(
    slidingInitialState,
    solverResult,
  )
  if (!verification.valid) return fallback

  if (solverResult.bestScoreFound > playerScore) {
    return {
      kind: 'reachable-higher',
      playerScore,
      reachableScore: solverResult.bestScoreFound,
    }
  }

  if (solverResult.bestScoreFound === playerScore) {
    return {
      kind: 'matches-best-found',
      playerScore,
      reachableScore: solverResult.bestScoreFound,
    }
  }

  return {
    kind: 'player-beat-solver',
    playerScore,
    reachableScore: solverResult.bestScoreFound,
  }
}
