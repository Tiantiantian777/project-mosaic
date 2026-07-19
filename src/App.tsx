import { useEffect, useMemo, useState } from 'react'
import {
  COLOR_LABELS,
  ColorKey,
  GameState,
  PlacedTile,
  TileCell,
  TileDefinition,
  canPlace,
  canSlide,
  colorGrid,
  createInitialState,
  pieceGrid,
  rotateCells,
  scoreByColor,
  topTwoScore,
} from './game'

const STORAGE_KEY = 'project-mosaic-state-v01'
const DEFAULT_SEED = 20260719

const COLOR_CLASS: Record<ColorKey, string> = {
  R: 'cell-red',
  Y: 'cell-yellow',
  G: 'cell-green',
  B: 'cell-blue',
}

function loadSavedGame(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState(DEFAULT_SEED)
    return JSON.parse(raw) as GameState
  } catch {
    return createInitialState(DEFAULT_SEED)
  }
}

function TilePreview({
  tile,
  rotation = 0,
  compact = false,
}: {
  tile: TileDefinition
  rotation?: number
  compact?: boolean
}) {
  const cells = rotateCells(tile.cells, rotation)
  const height = Math.max(...cells.map((cell) => cell.row)) + 1
  const width = Math.max(...cells.map((cell) => cell.col)) + 1
  const byPosition = new Map(
    cells.map((cell) => [`${cell.row},${cell.col}`, cell.color]),
  )

  return (
    <div
      className={`tile-preview ${compact ? 'tile-preview-compact' : ''}`}
      style={{ gridTemplateColumns: `repeat(${width}, var(--preview-cell))` }}
      aria-label={`Tile ${tile.id}`}
    >
      {Array.from({ length: height * width }, (_, index) => {
        const row = Math.floor(index / width)
        const col = index % width
        const color = byPosition.get(`${row},${col}`)

        return (
          <div
            key={`${row}-${col}`}
            className={`preview-cell ${color ? COLOR_CLASS[color] : 'preview-empty'}`}
          />
        )
      })}
    </div>
  )
}

function ScoreStrip({ state }: { state: GameState }) {
  const scores = scoreByColor(state)

  return (
    <div className="score-strip">
      {(Object.keys(scores) as ColorKey[]).map((color) => (
        <div key={color} className={`score-chip ${COLOR_CLASS[color]}`}>
          <span>{COLOR_LABELS[color]}</span>
          <strong>{scores[color]}</strong>
        </div>
      ))}
    </div>
  )
}

function App() {
  const [game, setGame] = useState<GameState>(loadSavedGame)
  const [seedInput, setSeedInput] = useState(String(game.seed))

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
  }, [game])

  const boardColors = useMemo(() => colorGrid(game), [game])
  const boardPieces = useMemo(() => pieceGrid(game), [game])
  const selectedTile =
    game.selectedDraftIndex === null
      ? null
      : game.visible[game.selectedDraftIndex] ?? null
  const rotatedSelectedCells = selectedTile
    ? rotateCells(selectedTile.cells, game.rotation)
    : null

  function updateGame(updater: (current: GameState) => GameState) {
    setGame((current) => updater(structuredClone(current)))
  }

  function chooseTile(index: number) {
    updateGame((next) => {
      next.selectedDraftIndex = index
      next.rotation = 0
      next.message = `Tile ${next.visible[index].id} selected. Tap a legal board cell.`
      return next
    })
  }

  function rotate(direction: number) {
    updateGame((next) => {
      next.rotation = (next.rotation + direction + 4) % 4
      next.message = 'Rotation updated.'
      return next
    })
  }

  function placeAt(row: number, col: number) {
    if (!selectedTile || !rotatedSelectedCells) return

    updateGame((next) => {
      if (
        !canPlace(
          next.placedTiles,
          rotatedSelectedCells,
          row,
          col,
          next.boardSize,
        )
      ) {
        next.message = 'That placement does not fit.'
        return next
      }

      const instanceId = `piece_${next.nextInstanceNumber}`
      const placed: PlacedTile = {
        instanceId,
        tileId: selectedTile.id,
        cells: rotatedSelectedCells.map((cell) => ({ ...cell })),
        row,
        col,
      }

      next.placedTiles.push(placed)
      next.nextInstanceNumber += 1

      const chosenIndex = next.selectedDraftIndex!
      next.visible.splice(chosenIndex, 1)
      const replacement = next.drawPile.shift()
      if (replacement) next.visible.push(replacement)

      next.selectedDraftIndex = null
      next.rotation = 0
      next.message = `${instanceId.replace('piece_', 'Piece ')} placed.`
      return next
    })
  }

  function startAdjustment() {
    updateGame((next) => {
      if (next.placedTiles.length === 0) {
        next.message = 'Place at least one tile first.'
        return next
      }

      next.phase = 'adjustment'
      next.selectedDraftIndex = null
      next.selectedPieceId = next.placedTiles[0]?.instanceId ?? null
      next.message = 'Adjustment phase: select a complete piece and slide it.'
      return next
    })
  }

  function selectBoardPiece(instanceId: string | null) {
    if (game.phase !== 'adjustment' || !instanceId) return
    updateGame((next) => {
      next.selectedPieceId = instanceId
      next.message = `${instanceId.replace('piece_', 'Piece ')} selected.`
      return next
    })
  }

  function slidePiece(deltaRow: number, deltaCol: number, label: string) {
    updateGame((next) => {
      const id = next.selectedPieceId
      if (!id || next.slideTokens <= 0) return next

      if (!canSlide(next, id, deltaRow, deltaCol)) {
        next.message = 'That whole-piece slide is blocked.'
        return next
      }

      const piece = next.placedTiles.find((item) => item.instanceId === id)
      if (!piece) return next

      piece.row += deltaRow
      piece.col += deltaCol
      next.slideTokens -= 1
      next.message = `${id.replace('piece_', 'Piece ')} moved ${label}.`

      if (next.slideTokens === 0) {
        next.phase = 'finished'
        next.message = `No slide tokens remain. Final score: ${topTwoScore(next)}.`
      }

      return next
    })
  }

  function finishGame() {
    updateGame((next) => {
      next.phase = 'finished'
      next.message = `Game finished with ${topTwoScore(next)} points.`
      return next
    })
  }

  function startNewGame() {
    const parsed = Number.parseInt(seedInput, 10)
    const seed = Number.isFinite(parsed) ? parsed : DEFAULT_SEED
    const fresh = createInitialState(seed)
    setGame(fresh)
    setSeedInput(String(seed))
  }

  const selectedPiece = game.placedTiles.find(
    (piece) => piece.instanceId === game.selectedPieceId,
  )

  const slideDirections = [
    { label: '↑', name: 'up', row: -1, col: 0 },
    { label: '←', name: 'left', row: 0, col: -1 },
    { label: '→', name: 'right', row: 0, col: 1 },
    { label: '↓', name: 'down', row: 1, col: 0 },
  ]

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Mobile web prototype · v0.1</p>
          <h1>Project Mosaic</h1>
          <p className="subtitle">
            Choose carefully. Place permanently. Optimize what remains.
          </p>
        </div>
        <div className="hero-score">
          <span>Top-two score</span>
          <strong>{topTwoScore(game)}</strong>
        </div>
      </header>

      <section className="status-row">
        <div className="status-card">
          <span>Phase</span>
          <strong>
            {game.phase === 'placement'
              ? 'Placement'
              : game.phase === 'adjustment'
                ? 'Adjustment'
                : 'Finished'}
          </strong>
        </div>
        <div className="status-card">
          <span>Pieces</span>
          <strong>{game.placedTiles.length}</strong>
        </div>
        <div className="status-card">
          <span>Slides</span>
          <strong>{game.slideTokens}</strong>
        </div>
      </section>

      <section className="panel board-panel">
        <div className="section-heading">
          <div>
            <p className="section-kicker">4 × 4 board</p>
            <h2>
              {game.phase === 'placement'
                ? selectedTile
                  ? 'Tap a legal anchor cell'
                  : 'Choose a tile below'
                : game.phase === 'adjustment'
                  ? 'Tap a piece to select it'
                  : 'Final board'}
            </h2>
          </div>
        </div>

        <div className="board" role="grid" aria-label="Project Mosaic board">
          {boardColors.flatMap((row, rowIndex) =>
            row.map((color, colIndex) => {
              const instanceId = boardPieces[rowIndex][colIndex]
              const isSelected =
                instanceId !== null && instanceId === game.selectedPieceId
              const isLegalAnchor =
                game.phase === 'placement' &&
                rotatedSelectedCells !== null &&
                canPlace(
                  game.placedTiles,
                  rotatedSelectedCells,
                  rowIndex,
                  colIndex,
                  game.boardSize,
                )

              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={[
                    'board-cell',
                    color ? COLOR_CLASS[color] : 'board-empty',
                    isSelected ? 'board-selected-piece' : '',
                    isLegalAnchor ? 'board-legal-anchor' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => {
                    if (game.phase === 'placement') {
                      placeAt(rowIndex, colIndex)
                    } else {
                      selectBoardPiece(instanceId)
                    }
                  }}
                  aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}`}
                >
                  {instanceId ? (
                    <span>{instanceId.replace('piece_', '#')}</span>
                  ) : isLegalAnchor ? (
                    <span className="anchor-dot">+</span>
                  ) : null}
                </button>
              )
            }),
          )}
        </div>

        <ScoreStrip state={game} />
        <p className="message" aria-live="polite">
          {game.message}
        </p>
      </section>

      {game.phase === 'placement' && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Draft</p>
              <h2>Choose one of three</h2>
            </div>
          </div>

          <div className="draft-grid">
            {game.visible.map((tile, index) => {
              const selected = game.selectedDraftIndex === index
              return (
                <button
                  key={`${tile.id}-${index}`}
                  className={`draft-card ${selected ? 'draft-selected' : ''}`}
                  onClick={() => chooseTile(index)}
                >
                  <span className="draft-label">
                    {selected ? 'Selected' : `Tile ${tile.id}`}
                  </span>
                  <TilePreview tile={tile} compact />
                </button>
              )
            })}
          </div>

          {selectedTile && (
            <div className="rotation-panel">
              <button
                className="round-button"
                onClick={() => rotate(-1)}
                aria-label="Rotate counterclockwise"
              >
                ↺
              </button>

              <div className="selected-preview">
                <span>Current orientation</span>
                <TilePreview tile={selectedTile} rotation={game.rotation} />
              </div>

              <button
                className="round-button"
                onClick={() => rotate(1)}
                aria-label="Rotate clockwise"
              >
                ↻
              </button>
            </div>
          )}

          <button
            className="primary-button"
            disabled={game.placedTiles.length === 0}
            onClick={startAdjustment}
          >
            Finish placement
          </button>
        </section>
      )}

      {game.phase === 'adjustment' && (
        <section className="panel adjustment-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Limited rearrangement</p>
              <h2>Slide the complete piece</h2>
            </div>
          </div>

          <div className="selected-piece-summary">
            {selectedPiece ? (
              <>
                <span>
                  Selected {selectedPiece.instanceId.replace('piece_', 'Piece ')}
                </span>
                <TilePreview
                  tile={{ id: selectedPiece.tileId, cells: selectedPiece.cells }}
                  compact
                />
              </>
            ) : (
              <span>Tap a piece on the board.</span>
            )}
          </div>

          <div className="direction-pad">
            {slideDirections.map((direction) => {
              const enabled =
                Boolean(game.selectedPieceId) &&
                game.slideTokens > 0 &&
                canSlide(
                  game,
                  game.selectedPieceId!,
                  direction.row,
                  direction.col,
                )

              return (
                <button
                  key={direction.name}
                  className={`direction-button direction-${direction.name}`}
                  disabled={!enabled}
                  onClick={() =>
                    slidePiece(
                      direction.row,
                      direction.col,
                      direction.name,
                    )
                  }
                >
                  {direction.label}
                </button>
              )
            })}
          </div>

          <button className="primary-button" onClick={finishGame}>
            End game now
          </button>
        </section>
      )}

      {game.phase === 'finished' && (
        <section className="panel final-panel">
          <p className="section-kicker">Result</p>
          <h2>{topTwoScore(game)} points</h2>
          <p>
            The score combines the two largest orthogonally connected color
            regions.
          </p>
          <button className="primary-button" onClick={startNewGame}>
            Play again
          </button>
        </section>
      )}

      <section className="panel setup-panel">
        <div>
          <p className="section-kicker">Puzzle seed</p>
          <h2>Start the same queue again</h2>
        </div>
        <div className="seed-row">
          <input
            value={seedInput}
            inputMode="numeric"
            onChange={(event) => setSeedInput(event.target.value)}
            aria-label="Puzzle seed"
          />
          <button onClick={startNewGame}>New game</button>
        </div>
      </section>

      <footer>
        <p>
          Progress is saved locally on this device. No account or backend is
          required.
        </p>
      </footer>
    </main>
  )
}

export default App
