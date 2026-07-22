import {
  SlidingState,
  SolverMove,
  analyzeBoard,
  applyMove,
  createSlidingState,
  getSlidingPuzzleKey,
  isLegalMove,
  isSlidingState,
  slidingStatesEqual,
} from '../engine'
import { DeveloperSolverResult, VerificationResult } from './types'

function invalidVerification(
  failureReason: string,
  replayedScore = 0,
): VerificationResult {
  return {
    valid: false,
    finalStateMatches: false,
    finalScoreMatches: false,
    replayedScore,
    failureReason,
  }
}

export function verifySolverResult(
  initialState: SlidingState,
  moves: readonly SolverMove[],
  claimedFinalState: SlidingState,
  claimedScore: number,
): VerificationResult {
  if (!isSlidingState(initialState)) {
    return invalidVerification('The provided initial sliding state is invalid.')
  }
  if (!isSlidingState(claimedFinalState)) {
    return invalidVerification('The claimed final sliding state is invalid.')
  }

  let replayedState = createSlidingState(initialState.board)
  for (let index = 0; index < moves.length; index += 1) {
    const move = moves[index]
    if (!isLegalMove(replayedState, move)) {
      return invalidVerification(
        `Move ${index + 1} is not legal from the replayed state.`,
        analyzeBoard(replayedState.board).totalScore,
      )
    }
    replayedState = applyMove(replayedState, move)
  }

  const replayedScore = analyzeBoard(replayedState.board).totalScore
  const finalStateMatches = slidingStatesEqual(
    replayedState,
    claimedFinalState,
  )
  const finalScoreMatches = replayedScore === claimedScore

  return {
    valid: finalStateMatches && finalScoreMatches,
    finalStateMatches,
    finalScoreMatches,
    replayedScore,
    failureReason: !finalStateMatches
      ? 'The replayed board does not match the claimed final board.'
      : !finalScoreMatches
        ? 'The canonical replayed score does not match the claimed score.'
        : undefined,
  }
}

export function verifyDeveloperSolverResult(
  initialState: SlidingState,
  result: DeveloperSolverResult,
): VerificationResult {
  if (result.initialStateKey !== getSlidingPuzzleKey(initialState)) {
    return invalidVerification(
      'The solver result belongs to a different initial puzzle state.',
    )
  }

  return verifySolverResult(
    initialState,
    result.moves,
    result.bestState,
    result.bestScoreFound,
  )
}
