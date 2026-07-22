import { useCallback, useEffect, useRef, useState } from 'react'
import { EndGameSummary } from './components/EndGameSummary'
import { GameHUD } from './components/GameHUD'
import { OnboardingModal } from './components/OnboardingModal'
import { PuzzleBoard } from './components/PuzzleBoard'
import { TileSelection } from './components/TileSelection'
import {
  GameState,
  createNextGameSeed,
  createInitialState,
  finalScore,
  finishGame,
  isPersistedGameState,
  placeSelectedTile,
  rotateSelectedDraftTile,
  resumeGame,
  selectDraftTile,
  slideTile,
} from './engine'
import { createEndGameSummary } from './endgame/endGame'
import { useDeveloperSolver } from './hooks/useDeveloperSolver'
import {
  closeOnboarding,
  createOnboardingState,
  markOnboardingCompleted,
  nextOnboardingStep,
  openOnboarding,
  previousOnboardingStep,
} from './onboarding/onboarding'

const STORAGE_KEY = 'project-mosaic-state-v05'
const DEFAULT_SEED = 20260719

function loadSavedGame(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return createInitialState(DEFAULT_SEED)
    const parsed: unknown = JSON.parse(saved)
    return isPersistedGameState(parsed)
      ? parsed
      : createInitialState(DEFAULT_SEED)
  } catch {
    return createInitialState(DEFAULT_SEED)
  }
}

function App() {
  const [game, setGame] = useState<GameState>(loadSavedGame)
  const [seedInput, setSeedInput] = useState(String(game.seed))
  const [onboarding, setOnboarding] = useState(createOnboardingState)
  const rulesButtonRef = useRef<HTMLButtonElement>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const gameHeadingRef = useRef<HTMLHeadingElement>(null)
  const solverSession = useDeveloperSolver(game.slidingInitialState)
  const endGameSummary =
    game.phase === 'finished'
      ? createEndGameSummary(
          { board: game.board },
          game.slidingInitialState,
          solverSession.result,
        )
      : null

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
    } catch {
      // The game remains playable when browser storage is unavailable.
    }
  }, [game])

  const dismissOnboarding = useCallback(() => {
    markOnboardingCompleted()
    setOnboarding(closeOnboarding)
  }, [])

  function beginGame(seed: number) {
    setGame(createInitialState(seed))
    setSeedInput(String(seed))
  }

  function loadSeedGame() {
    const parsedSeed = Number.parseInt(seedInput, 10)
    const seed = Number.isFinite(parsedSeed) ? parsedSeed : DEFAULT_SEED
    beginGame(seed)
  }

  function startFreshGame() {
    beginGame(createNextGameSeed(game.seed, Date.now()))
    requestAnimationFrame(() => gameHeadingRef.current?.focus())
  }

  const keepTrying = useCallback(() => {
    setGame(resumeGame)
    requestAnimationFrame(() => submitButtonRef.current?.focus())
  }, [])

  return (
    <>
      <main
        className="app-shell"
        aria-hidden={onboarding.isOpen || endGameSummary ? true : undefined}
      >
        <header className="hero">
          <div>
            <p className="eyebrow">Color strategy · sliding puzzle</p>
            <h1 tabIndex={-1} ref={gameHeadingRef}>
              Project Mosaic
            </h1>
            <p className="subtitle">
              Draft fifteen color-pattern tiles, then tune their connections
              with as many legal slides as you need.
            </p>
          </div>
          <div className="hero-actions">
            <button
              type="button"
              className="rules-button"
              onClick={() => setOnboarding(openOnboarding)}
              ref={rulesButtonRef}
            >
              How to play
            </button>
            <div className="hero-score" aria-label="Top-two color score">
              <span>Top-two score</span>
              <strong>{finalScore(game.board)}</strong>
            </div>
          </div>
        </header>

        {game.phase === 'placement' && (
          <TileSelection
            tiles={game.visibleTiles}
            selectedIndex={game.selectedDraftIndex}
            selectedRotation={game.selectedRotation}
            onSelect={(index) =>
              setGame((state) => selectDraftTile(state, index))
            }
            onRotate={(direction) =>
              setGame((state) => rotateSelectedDraftTile(state, direction))
            }
          />
        )}

        <GameHUD state={game} />

        <PuzzleBoard
          state={game}
          onPlace={(slotIndex) =>
            setGame((state) => placeSelectedTile(state, slotIndex))
          }
          onSlide={(tileId) => setGame((state) => slideTile(state, tileId))}
        />

        {game.phase === 'sliding' && (
          <section className="panel finish-panel">
            <div>
              <p className="section-kicker">Ready when you are</p>
              <h2>Keep sliding or submit the mosaic</h2>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setGame((state) => finishGame(state))}
              ref={submitButtonRef}
            >
              Submit mosaic
            </button>
          </section>
        )}

        <section className="panel setup-panel">
          <div>
            <p className="section-kicker">Puzzle seed</p>
            <h2>Replay the same draft sequence</h2>
          </div>
          <div className="seed-row">
            <input
              value={seedInput}
              inputMode="numeric"
              aria-label="Puzzle seed"
              onChange={(event) => setSeedInput(event.target.value)}
            />
            <button type="button" onClick={loadSeedGame}>
              Load seed
            </button>
          </div>
        </section>

        <footer>
          Progress is saved on this device. Draft tiles may rotate before
          placement; placed tiles lock and never rotate afterward.
        </footer>
      </main>

      {onboarding.isOpen && (
        <OnboardingModal
          stepIndex={onboarding.stepIndex}
          onBack={() => setOnboarding(previousOnboardingStep)}
          onNext={() => setOnboarding(nextOnboardingStep)}
          onClose={dismissOnboarding}
          restoreFocusRef={
            onboarding.openedManually ? rulesButtonRef : undefined
          }
        />
      )}

      {endGameSummary && !onboarding.isOpen && (
        <EndGameSummary
          summary={endGameSummary}
          onKeepTrying={keepTrying}
          onNewGame={startFreshGame}
        />
      )}
    </>
  )
}

export default App
