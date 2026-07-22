export const ONBOARDING_STORAGE_KEY = 'mosaic:onboarding-completed'
export const ONBOARDING_STEP_COUNT = 4

export interface OnboardingStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface OnboardingState {
  readonly isOpen: boolean
  readonly stepIndex: number
  readonly openedManually: boolean
}

function browserStorage(): OnboardingStorage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function hasCompletedOnboarding(
  storage: OnboardingStorage | null = browserStorage(),
): boolean {
  try {
    return storage?.getItem(ONBOARDING_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function markOnboardingCompleted(
  storage: OnboardingStorage | null = browserStorage(),
): void {
  try {
    storage?.setItem(ONBOARDING_STORAGE_KEY, 'true')
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export function createOnboardingState(
  completed = hasCompletedOnboarding(),
): OnboardingState {
  return {
    isOpen: !completed,
    stepIndex: 0,
    openedManually: false,
  }
}

export function openOnboarding(state: OnboardingState): OnboardingState {
  return {
    ...state,
    isOpen: true,
    stepIndex: 0,
    openedManually: true,
  }
}

export function closeOnboarding(state: OnboardingState): OnboardingState {
  return {
    ...state,
    isOpen: false,
  }
}

export function nextOnboardingStep(state: OnboardingState): OnboardingState {
  return {
    ...state,
    stepIndex: Math.min(state.stepIndex + 1, ONBOARDING_STEP_COUNT - 1),
  }
}

export function previousOnboardingStep(state: OnboardingState): OnboardingState {
  return {
    ...state,
    stepIndex: Math.max(state.stepIndex - 1, 0),
  }
}
