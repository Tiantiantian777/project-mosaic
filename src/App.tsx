import { useEffect, useState } from 'react'
import { GameHUD } from './components/GameHUD'
import { PuzzleBoard } from './components/PuzzleBoard'
import { TileSelection } from './components/TileSelection'
import {
  GameState,
  createInitialState,
  finalScore,
  finishGame,
  isPersistedGameState,
  placeSelectedTile,
  selectDraftTile,
  slideTile,
} from './engine'

const STORAGE_KEY = 'project-mosaic-state-v02'
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
  }, [game])

  function startNewGame() {
    const parsedSeed = Number.parseInt(seedInput, 10)
    const seed = Number.isFinite(parsedSeed) ? parsedSeed : DEFAULT_SEED
    setGame(createInitialState(seed))
    setSeedInput(String(seed))
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Color strategy · sliding puzzle</p>
          <h1>Project Mosaic</h1>
          <p className="subtitle">
            Draft fifteen color-pattern tiles, then tune their connections with
            five precise slides.
          </p>
        </div>
        <div className="hero-score" aria-label="Top-two color score">
          <span>Top-two score</span>
          <strong>{finalScore(game.board)}</strong>
        </div>
      </header>

      {game.phase === 'placement' && (
        <TileSelection
          tiles={game.visibleTiles}
          selectedIndex={game.selectedDraftIndex}
          onSelect={(index) => setGame((state) => selectDraftTile(state, index))}
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
            <h2>Keep sliding or lock in the mosaic</h2>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setGame((state) => finishGame(state))}
          >
            Finish now
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
        Progress is saved on this device. Tiles never rotate, overlap, or leave
        their large board slots.
      </footer>
    </main>
  )
}

export default App
