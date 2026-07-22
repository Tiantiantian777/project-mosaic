import { describe, expect, it } from 'vitest'
import { createInitialState } from '../engine'
import {
  ONBOARDING_STORAGE_KEY,
  OnboardingStorage,
  closeOnboarding,
  createOnboardingState,
  hasCompletedOnboarding,
  markOnboardingCompleted,
  nextOnboardingStep,
  openOnboarding,
  previousOnboardingStep,
} from './onboarding'

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  const storage: OnboardingStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }

  return { storage, values }
}

describe('onboarding preference', () => {
  it('opens for a first-time visitor', () => {
    const { storage } = memoryStorage()

    expect(hasCompletedOnboarding(storage)).toBe(false)
    expect(createOnboardingState(hasCompletedOnboarding(storage))).toEqual({
      isOpen: true,
      stepIndex: 0,
      openedManually: false,
    })
  })

  it('stays closed for a returning visitor', () => {
    const { storage } = memoryStorage({
      [ONBOARDING_STORAGE_KEY]: 'true',
    })

    expect(hasCompletedOnboarding(storage)).toBe(true)
    expect(createOnboardingState(hasCompletedOnboarding(storage)).isOpen).toBe(
      false,
    )
  })

  it('persists completion under the onboarding key', () => {
    const { storage, values } = memoryStorage()

    markOnboardingCompleted(storage)

    expect(values.get(ONBOARDING_STORAGE_KEY)).toBe('true')
  })

  it('fails safely when browser storage cannot be read or written', () => {
    const unavailableStorage: OnboardingStorage = {
      getItem: () => {
        throw new Error('storage unavailable')
      },
      setItem: () => {
        throw new Error('storage unavailable')
      },
    }

    expect(hasCompletedOnboarding(unavailableStorage)).toBe(false)
    expect(() => markOnboardingCompleted(unavailableStorage)).not.toThrow()
  })
})

describe('onboarding view state', () => {
  it('reopens at step one when the Rules button is used', () => {
    const completed = createOnboardingState(true)
    const reopened = openOnboarding({ ...completed, stepIndex: 3 })

    expect(reopened).toEqual({
      isOpen: true,
      stepIndex: 0,
      openedManually: true,
    })
  })

  it('moves through the four steps without passing either end', () => {
    let state = createOnboardingState(false)
    state = previousOnboardingStep(state)
    expect(state.stepIndex).toBe(0)

    for (let index = 0; index < 5; index += 1) {
      state = nextOnboardingStep(state)
    }
    expect(state.stepIndex).toBe(3)
  })

  it('opens and closes without changing game state', () => {
    const game = createInitialState(42)
    const originalGameSnapshot = JSON.stringify(game)
    const session = {
      game,
      onboarding: createOnboardingState(true),
    }

    const openedSession = {
      ...session,
      onboarding: openOnboarding(session.onboarding),
    }
    const closedSession = {
      ...openedSession,
      onboarding: closeOnboarding(openedSession.onboarding),
    }

    expect(openedSession.game).toBe(game)
    expect(closedSession.game).toBe(game)
    expect(JSON.stringify(game)).toBe(originalGameSnapshot)
  })
})
