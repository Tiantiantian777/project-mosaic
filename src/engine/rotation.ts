import { Tile, TileColors, TileRotation } from './types'

function rotateColorsClockwise(colors: TileColors): TileColors {
  return [
    [colors[1][0], colors[0][0]],
    [colors[1][1], colors[0][1]],
  ]
}

export function rotateTile(tile: Tile, rotation: TileRotation): Tile {
  let colors = tile.colors

  for (let turn = 0; turn < rotation; turn += 1) {
    colors = rotateColorsClockwise(colors)
  }

  return {
    id: tile.id,
    colors,
  }
}
