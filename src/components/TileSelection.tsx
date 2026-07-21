import { Tile } from '../engine'
import { MosaicTile } from './MosaicTile'

interface TileSelectionProps {
  tiles: readonly Tile[]
  selectedIndex: number | null
  onSelect: (index: number) => void
}

export function TileSelection({
  tiles,
  selectedIndex,
  onSelect,
}: TileSelectionProps) {
  return (
    <section className="panel tile-selection" aria-labelledby="draft-heading">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Choose a pattern</p>
          <h2 id="draft-heading">Three tiles are available</h2>
        </div>
        <span className="selection-hint">Select, then place below</span>
      </div>

      <div className="draft-grid">
        {tiles.map((tile, index) => {
          const selected = selectedIndex === index
          return (
            <button
              type="button"
              key={tile.id}
              className={`draft-card ${selected ? 'draft-selected' : ''}`}
              aria-pressed={selected}
              aria-label={`${selected ? 'Selected' : 'Select'} ${tile.id}`}
              onClick={() => onSelect(index)}
            >
              <MosaicTile tile={tile} compact />
              <span className="draft-label">
                {selected ? 'Selected' : tile.id}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
