import { useCallback, useEffect, useRef, useState } from 'react'
import { GameHUD } from './components/GameHUD'
import { OnboardingModal } from './components/OnboardingModal'
import { PuzzleBoard } from './components/PuzzleBoard'
import { TileSelection } from './components/TileSelection'
import {
  GameState,
  createInitialState,
  finalScore,
  finishGame,
  isPersistedGameState,
  placeSelectedTile,
  rotateSelectedDraftTile,
  selectDraftTile,
  slideTile,
} from './engine'
import {
  closeOnboarding,
  createOnboardingState,
  markOnboardingCompleted,
  nextOnboardingStep,
  openOnboarding,
  previousOnboardingStep,
} from './onboarding/onboarding'

const STORAGE_KEY = 'project-mosaic-state-v04'
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

  function startNewGame() {
    const parsedSeed = Number.parseInt(seedInput, 10)
    const seed = Number.isFinite(parsedSeed) ? parsedSeed : DEFAULT_SEED
    setGame(createInitialState(seed))
    setSeedInput(String(seed))
  }

  return (
    <>
      <main
        className="app-shell"
        aria-hidden={onboarding.isOpen ? true : undefined}
      >
      <header className="hero">
        <div>
          <p className="eyebrow">Color strategy · sliding puzzle</p>
          <h1>Project Mosaic</h1>
          <p className="subtitle">
            Draft fifteen color-pattern tiles, then tune their connections with
            as many legal slides as you need.
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
          onSelect={(index) => setGame((state) => selectDraftTile(state, index))}
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
          >
            Submit mosaic
          </button>
        </section>
      )}

      {game.phase === 'finished' && (
        <section className="panel result-panel">
          <p className="section-kicker">Final result</p>
          <h2>{finalScore(game.board)} points</h2>
          <p>
            The score combines the two largest orthogonally connected color
            regions across the full 8 × 8 mini-cell grid.
          </p>
          <button type="button" className="primary-button" onClick={startNewGame}>
            Play again
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
          <button type="button" onClick={startNewGame}>
            New game
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
    </>
  )
}

export default App
