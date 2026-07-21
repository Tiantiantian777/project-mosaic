import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { OnboardingModal } from './OnboardingModal'

function renderStep(stepIndex: number) {
  return renderToStaticMarkup(
    <OnboardingModal
      stepIndex={stepIndex}
      onBack={() => undefined}
      onNext={() => undefined}
      onClose={() => undefined}
    />,
  )
}

describe('OnboardingModal', () => {
  it('renders an accessible first step with skip and next actions', () => {
    const markup = renderStep(0)

    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toContain('Close how to play')
    expect(markup).toContain('1 of 4')
    expect(markup).toContain('Choose a tile')
    expect(markup).toContain('The whole 2 × 2 pattern moves together.')
    expect(markup).toContain('Skip')
    expect(markup).toContain('Next')
  })

  it('explains locked sliding behavior', () => {
    const markup = renderStep(2)

    expect(markup).toContain('3 of 4')
    expect(markup).toContain('Slide the puzzle')
    expect(markup).toContain('Only horizontal or vertical neighbors can slide.')
    expect(markup).toContain('Placed tiles cannot rotate or move freely.')
  })

  it('ends with scoring guidance and a start action', () => {
    const markup = renderStep(3)

    expect(markup).toContain('4 of 4')
    expect(markup).toContain('Connect colors')
    expect(markup).toContain('even across the boundary between two tiles')
    expect(markup).toContain(
      'Your final score uses the two largest color-region scores.',
    )
    expect(markup).toContain('Start playing')
  })
})
