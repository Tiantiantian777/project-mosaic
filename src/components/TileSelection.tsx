import {
  RotationDirection,
  Tile,
  TileRotation,
  rotateTile,
} from '../engine'
import { MosaicTile } from './MosaicTile'

interface TileSelectionProps {
  tiles: readonly Tile[]
  selectedIndex: number | null
  selectedRotation: TileRotation
  onSelect: (index: number) => void
  onRotate: (direction: RotationDirection) => void
}

export function TileSelection({
  tiles,
  selectedIndex,
  selectedRotation,
  onSelect,
  onRotate,
}: TileSelectionProps) {
  const selectedTile =
    selectedIndex === null ? null : tiles[selectedIndex] ?? null

  return (
    <section className="panel tile-selection" aria-labelledby="draft-heading">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Choose a pattern</p>
          <h2 id="draft-heading">Three tiles are available</h2>
        </div>
        <span className="selection-hint">Select, rotate, then place</span>
      </div>

      <div className="draft-grid">
        {tiles.map((tile, index) => {
          const selected = selectedIndex === index
          const displayTile = selected
            ? rotateTile(tile, selectedRotation)
            : tile
          return (
            <button
              type="button"
              key={tile.id}
              className={`draft-card ${selected ? 'draft-selected' : ''}`}
              aria-pressed={selected}
              aria-label={`${selected ? 'Selected' : 'Select'} ${tile.id}`}
              onClick={() => onSelect(index)}
            >
              <MosaicTile tile={displayTile} compact />
              <span className="draft-label">
                {selected ? 'Selected' : tile.id}
              </span>
            </button>
          )
        })}
      </div>

      {selectedTile && (
        <div
          className="rotation-controls"
          aria-label={`Rotate ${selectedTile.id} before placement`}
        >
          <button
            type="button"
            className="rotation-button"
            aria-label={`Rotate ${selectedTile.id} counterclockwise`}
            onClick={() => onRotate('counterclockwise')}
          >
            ↺
          </button>
          <div className="rotation-copy">
            <strong>{selectedTile.id}</strong>
            <span>
              {selectedRotation * 90}° · orientation locks when placed
            </span>
          </div>
          <button
            type="button"
            className="rotation-button"
            aria-label={`Rotate ${selectedTile.id} clockwise`}
            onClick={() => onRotate('clockwise')}
          >
            ↻
          </button>
        </div>
      )}
    </section>
  )
}
