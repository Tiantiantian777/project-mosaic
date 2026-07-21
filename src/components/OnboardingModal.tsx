import { RefObject, useEffect, useRef } from 'react'
import { ONBOARDING_STEP_COUNT } from '../onboarding/onboarding'

interface OnboardingModalProps {
  stepIndex: number
  onBack: () => void
  onNext: () => void
  onClose: () => void
  restoreFocusRef?: RefObject<HTMLButtonElement>
}

const STEPS = [
  {
    kicker: 'Build your mosaic',
    title: 'Choose a tile',
    description:
      'Pick one of the three visible tiles. Every tile is a square with four colored mini-cells.',
    points: [
      'The whole 2 × 2 pattern moves together.',
      'A new choice appears after each placement.',
    ],
  },
  {
    kicker: 'Set the board',
    title: 'Place the tile',
    description:
      'Rotate the selected pattern if you like, then place the complete tile into one large board slot.',
    points: [
      'Its orientation locks as soon as it is placed.',
      'Place 15 tiles and leave exactly one slot empty.',
    ],
  },
  {
    kicker: 'Tune your layout',
    title: 'Slide the puzzle',
    description:
      'Tap or drag a tile next to the empty slot. It slides into the gap and leaves a new empty slot behind.',
    points: [
      'Only horizontal or vertical neighbors can slide.',
      'Placed tiles cannot rotate or move freely.',
    ],
  },
  {
    kicker: 'Grow your score',
    title: 'Connect colors',
    description:
      'Matching mini-cells connect when their edges touch—even across the boundary between two tiles.',
    points: [
      'Larger connected color regions score higher.',
      'Your final score uses the two largest color-region scores.',
    ],
  },
] as const

const PATTERNS = [
  ['red', 'yellow', 'green', 'blue'],
  ['blue', 'green', 'blue', 'red'],
  ['yellow', 'red', 'green', 'yellow'],
] as const

function Pattern({ colors }: { colors: readonly string[] }) {
  return (
    <span className="tutorial-pattern">
      {colors.map((color, index) => (
        <span className={`tutorial-cell tutorial-cell-${color}`} key={index} />
      ))}
    </span>
  )
}

function TutorialVisual({ stepIndex }: { stepIndex: number }) {
  if (stepIndex === 0) {
    return (
      <div className="tutorial-visual tutorial-choices" aria-hidden="true">
        {PATTERNS.map((pattern, index) => (
          <span
            className={`tutorial-choice ${index === 1 ? 'tutorial-choice-selected' : ''}`}
            key={index}
          >
            <Pattern colors={pattern} />
          </span>
        ))}
      </div>
    )
  }

  if (stepIndex === 1) {
    return (
      <div className="tutorial-visual tutorial-placement" aria-hidden="true">
        <span className="tutorial-floating-tile">
          <Pattern colors={PATTERNS[0]} />
          <span className="tutorial-rotate-mark">↻</span>
        </span>
        <span className="tutorial-placement-arrow">→</span>
        <span className="tutorial-mini-board">
          {Array.from({ length: 16 }, (_, index) => (
            <span
              className={index === 6 ? 'tutorial-target-slot' : ''}
              key={index}
            >
              {index === 6 && <Pattern colors={PATTERNS[0]} />}
            </span>
          ))}
        </span>
      </div>
    )
  }

  if (stepIndex === 2) {
    return (
      <div className="tutorial-visual tutorial-slide" aria-hidden="true">
        <span className="tutorial-slide-tile">
          <Pattern colors={PATTERNS[1]} />
        </span>
        <span className="tutorial-slide-arrow">→</span>
        <span className="tutorial-empty-slot" />
      </div>
    )
  }

  return (
    <div className="tutorial-visual tutorial-connect" aria-hidden="true">
      <Pattern colors={['yellow', 'blue', 'red', 'green']} />
      <span className="tutorial-connection-line" />
      <Pattern colors={['blue', 'red', 'green', 'yellow']} />
    </div>
  )
}

export function OnboardingModal({
  stepIndex,
  onBack,
  onNext,
  onClose,
  restoreFocusRef,
}: OnboardingModalProps) {
  const dialogRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const step = STEPS[stepIndex] ?? STEPS[0]
  const isLastStep = stepIndex === ONBOARDING_STEP_COUNT - 1

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const restoreFocusTarget = restoreFocusRef?.current
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
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
      restoreFocusTarget?.focus()
    }
  }, [onClose, restoreFocusRef])

  return (
    <div className="onboarding-backdrop">
      <section
        className="onboarding-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
        ref={dialogRef}
      >
        <header className="onboarding-header">
          <div>
            <p className="section-kicker">How to play</p>
            <p className="onboarding-progress-label">
              {stepIndex + 1} of {ONBOARDING_STEP_COUNT}
            </p>
          </div>
          <button
            type="button"
            className="onboarding-close"
            aria-label="Close how to play"
            onClick={onClose}
            ref={closeButtonRef}
          >
            ×
          </button>
        </header>

        <div className="onboarding-progress" aria-hidden="true">
          <span
            style={{
              width: `${((stepIndex + 1) / ONBOARDING_STEP_COUNT) * 100}%`,
            }}
          />
        </div>

        <div className="onboarding-step" aria-live="polite" key={stepIndex}>
          <TutorialVisual stepIndex={stepIndex} />
          <div className="onboarding-copy">
            <p className="section-kicker">{step.kicker}</p>
            <h2 id="onboarding-title">{step.title}</h2>
            <p id="onboarding-description">{step.description}</p>
            <ul>
              {step.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="onboarding-footer">
          <button type="button" className="onboarding-skip" onClick={onClose}>
            {isLastStep ? 'Close' : 'Skip'}
          </button>
          <div className="onboarding-navigation">
            {stepIndex > 0 && (
              <button
                type="button"
                className="secondary-button"
                onClick={onBack}
              >
                Back
              </button>
            )}
            <button
              type="button"
              className="primary-button"
              onClick={isLastStep ? onClose : onNext}
            >
              {isLastStep ? 'Start playing' : 'Next'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}
