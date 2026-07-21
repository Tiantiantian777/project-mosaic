import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Tile } from '../engine'
import { TileSelection } from './TileSelection'

const tile: Tile = {
  id: 'tile-test',
  colors: [
    ['R', 'Y'],
    ['G', 'B'],
  ],
}

describe('TileSelection rotation controls', () => {
  it('shows controls for the selected tile and previews its orientation', () => {
    const markup = renderToStaticMarkup(
      <TileSelection
        tiles={[tile]}
        selectedIndex={0}
        selectedRotation={1}
        onSelect={() => undefined}
        onRotate={() => undefined}
      />,
    )

    expect(markup).toContain('Rotate tile-test before placement')
    expect(markup).toContain('Rotate tile-test counterclockwise')
    expect(markup).toContain('Rotate tile-test clockwise')
    expect(markup).toContain('90° · orientation locks when placed')

    const green = markup.indexOf('mini-cell-green')
    const red = markup.indexOf('mini-cell-red')
    const blue = markup.indexOf('mini-cell-blue')
    const yellow = markup.indexOf('mini-cell-yellow')
    expect(green).toBeLessThan(red)
    expect(red).toBeLessThan(blue)
    expect(blue).toBeLessThan(yellow)
  })

  it('hides rotation controls until a draft tile is selected', () => {
    const markup = renderToStaticMarkup(
      <TileSelection
        tiles={[tile]}
        selectedIndex={null}
        selectedRotation={0}
        onSelect={() => undefined}
        onRotate={() => undefined}
      />,
    )

    expect(markup).not.toContain('rotation-controls')
    expect(markup).not.toContain('Rotate tile-test clockwise')
  })
})
