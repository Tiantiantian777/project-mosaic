import { COLOR_LABELS, Color, Tile } from '../engine'

const COLOR_CLASS: Record<Color, string> = {
  R: 'mini-cell-red',
  Y: 'mini-cell-yellow',
  G: 'mini-cell-green',
  B: 'mini-cell-blue',
}

interface MosaicTileProps {
  tile: Tile
  compact?: boolean
}

export function MosaicTile({ tile, compact = false }: MosaicTileProps) {
  return (
    <span
      className={`mosaic-tile ${compact ? 'mosaic-tile-compact' : ''}`}
      aria-hidden="true"
    >
      {tile.colors.flatMap((row, rowIndex) =>
        row.map((color, columnIndex) => (
          <span
            key={`${rowIndex}-${columnIndex}`}
            className={`mini-cell ${COLOR_CLASS[color]}`}
            title={COLOR_LABELS[color]}
          />
        )),
      )}
    </span>
  )
}
