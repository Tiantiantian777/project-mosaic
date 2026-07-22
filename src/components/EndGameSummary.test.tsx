import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EndGameSummaryModel } from '../endgame/endGame'
import { EndGameSummary } from './EndGameSummary'

function renderSummary(summary: EndGameSummaryModel) {
  return renderToStaticMarkup(
    <EndGameSummary
      summary={summary}
      onKeepTrying={() => undefined}
      onNewGame={() => undefined}
    />,
  )
}

describe('EndGameSummary', () => {
  it('renders accessible actions and a verified higher target', () => {
    const markup = renderSummary({
      kind: 'reachable-higher',
      playerScore: 31,
      reachableScore: 36,
    })

    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('Your Score')
    expect(markup).toContain('31')
    expect(markup).toContain('36')
    expect(markup).toContain('is reachable by only sliding!')
    expect(markup).toContain('Keep Trying')
    expect(markup).toContain('New Game')
  })

  it('describes an equal result as best found without an optimality claim', () => {
    const markup = renderSummary({
      kind: 'matches-best-found',
      playerScore: 36,
      reachableScore: 36,
    })

    expect(markup).toContain('best result we found so far')
    expect(markup).not.toContain('optimal')
    expect(markup).not.toContain('maximum')
  })

  it('celebrates a player score above the solver result', () => {
    const markup = renderSummary({
      kind: 'player-beat-solver',
      playerScore: 38,
      reachableScore: 36,
    })

    expect(markup).toContain('You beat our solver')
    expect(markup).toContain('Excellent work.')
  })

  it('shows no numeric target when no verified result is available', () => {
    const markup = renderSummary({ kind: 'fallback', playerScore: 31 })

    expect(markup).toContain('A stronger connection may still be possible.')
    expect(markup).not.toContain('is reachable')
  })
})
