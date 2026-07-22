import { useEffect, useRef } from 'react'
import { EndGameSummaryModel } from '../endgame/endGame'

interface EndGameSummaryProps {
  summary: EndGameSummaryModel
  onKeepTrying: () => void
  onNewGame: () => void
}

function ResultMessage({ summary }: { summary: EndGameSummaryModel }) {
  if (summary.kind === 'reachable-higher') {
    return (
      <>
        <p className="reachable-result">
          <strong>{summary.reachableScore}</strong>
          <span>is reachable by only sliding!</span>
        </p>
        <p className="endgame-invitation">Can you find it?</p>
      </>
    )
  }

  if (summary.kind === 'matches-best-found') {
    return (
      <>
        <p className="endgame-message">
          That matches the best result we found so far!
        </p>
        <p className="endgame-invitation">Can you improve it?</p>
      </>
    )
  }

  if (summary.kind === 'player-beat-solver') {
    return (
      <>
        <p className="endgame-message">
          You beat our solver&apos;s best found score!
        </p>
        <p className="endgame-invitation">Excellent work.</p>
      </>
    )
  }

  return (
    <p className="endgame-message">
      Keep exploring. A stronger connection may still be possible.
    </p>
  )
}

export function EndGameSummary({
  summary,
  onKeepTrying,
  onNewGame,
}: EndGameSummaryProps) {
  const dialogRef = useRef<HTMLElement>(null)
  const keepTryingRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    keepTryingRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onKeepTrying()
        return
      }

      if (event.key !== 'Tab') return
      const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>(
        'button:not([disabled])',
      )
      if (!buttons?.length) return
      const first = buttons[0]
      const last = buttons[buttons.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onKeepTrying])

  return (
    <div className="endgame-backdrop">
      <section
        className="endgame-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="endgame-heading"
        aria-describedby="endgame-description"
        ref={dialogRef}
      >
        <p className="section-kicker">Mosaic submitted</p>
        <h2 id="endgame-heading">Your Score</h2>
        <p className="player-result" aria-label={`${summary.playerScore} points`}>
          {summary.playerScore}
        </p>
        <div
          id="endgame-description"
          className="endgame-result-copy"
          aria-live="polite"
        >
          <ResultMessage summary={summary} />
        </div>
        <div className="endgame-actions">
          <button
            type="button"
            className="primary-button"
            onClick={onKeepTrying}
            ref={keepTryingRef}
          >
            Keep Trying
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onNewGame}
          >
            New Game
          </button>
        </div>
      </section>
    </div>
  )
}
