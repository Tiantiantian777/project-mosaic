import {
  BOARD_DIMENSION,
  Board,
  COLORS,
  Color,
  MINI_GRID_DIMENSION,
  TILE_MINI_DIMENSION,
} from './types'

export type MiniCell = Color | null
export type MiniGrid = MiniCell[][]

export interface ColorAnalysis {
  readonly largestRegion: number
  readonly componentSizes: readonly number[]
}

export interface BoardAnalysis {
  readonly totalScore: number
  readonly colorStats: Record<Color, ColorAnalysis>
  readonly scoringColors: readonly Color[]
}

export function expandBoardToMiniGrid(board: Board): MiniGrid {
  const grid = Array.from({ length: MINI_GRID_DIMENSION }, () =>
    Array<MiniCell>(MINI_GRID_DIMENSION).fill(null),
  )

  board.forEach((tile, slotIndex) => {
    if (!tile) return

    const slotRow = Math.floor(slotIndex / BOARD_DIMENSION)
    const slotColumn = slotIndex % BOARD_DIMENSION

    for (let miniRow = 0; miniRow < TILE_MINI_DIMENSION; miniRow += 1) {
      for (
        let miniColumn = 0;
        miniColumn < TILE_MINI_DIMENSION;
        miniColumn += 1
      ) {
        grid[slotRow * TILE_MINI_DIMENSION + miniRow][
          slotColumn * TILE_MINI_DIMENSION + miniColumn
        ] = tile.colors[miniRow][miniColumn]
      }
    }
  })

  return grid
}

export function connectedComponentSizes(
  grid: MiniGrid,
  color: Color,
): number[] {
  const visited = new Set<string>()
  const componentSizes: number[] = []

  for (let row = 0; row < grid.length; row += 1) {
    for (let column = 0; column < grid[row].length; column += 1) {
      const startKey = `${row},${column}`
      if (grid[row][column] !== color || visited.has(startKey)) continue

      const queue: Array<[number, number]> = [[row, column]]
      visited.add(startKey)
      let regionSize = 0
      let queueIndex = 0

      while (queueIndex < queue.length) {
        const [currentRow, currentColumn] = queue[queueIndex]
        queueIndex += 1
        regionSize += 1

        const neighbors: Array<[number, number]> = [
          [currentRow - 1, currentColumn],
          [currentRow + 1, currentColumn],
          [currentRow, currentColumn - 1],
          [currentRow, currentColumn + 1],
        ]

        for (const [nextRow, nextColumn] of neighbors) {
          const key = `${nextRow},${nextColumn}`
          const inside =
            nextRow >= 0 &&
            nextRow < grid.length &&
            nextColumn >= 0 &&
            nextColumn < grid[nextRow].length

          if (
            inside &&
            grid[nextRow][nextColumn] === color &&
            !visited.has(key)
          ) {
            visited.add(key)
            queue.push([nextRow, nextColumn])
          }
        }
      }

      componentSizes.push(regionSize)
    }
  }

  return componentSizes.sort((first, second) => second - first)
}

export function largestConnectedRegion(grid: MiniGrid, color: Color): number {
  return connectedComponentSizes(grid, color)[0] ?? 0
}

export function analyzeBoard(board: Board): BoardAnalysis {
  const grid = expandBoardToMiniGrid(board)
  const colorStats = COLORS.reduce<Record<Color, ColorAnalysis>>(
    (stats, color) => {
      const componentSizes = connectedComponentSizes(grid, color)
      stats[color] = {
        largestRegion: componentSizes[0] ?? 0,
        componentSizes,
      }
      return stats
    },
    {
      R: { largestRegion: 0, componentSizes: [] },
      Y: { largestRegion: 0, componentSizes: [] },
      G: { largestRegion: 0, componentSizes: [] },
      B: { largestRegion: 0, componentSizes: [] },
    },
  )
  const scoringColors = [...COLORS]
    .sort(
      (first, second) =>
        colorStats[second].largestRegion - colorStats[first].largestRegion ||
        COLORS.indexOf(first) - COLORS.indexOf(second),
    )
    .slice(0, 2)
  const totalScore = scoringColors.reduce(
    (total, color) => total + colorStats[color].largestRegion,
    0,
  )

  return { totalScore, colorStats, scoringColors }
}

export function scoreByColor(board: Board): Record<Color, number> {
  const analysis = analyzeBoard(board)
  return COLORS.reduce<Record<Color, number>>((scores, color) => {
    scores[color] = analysis.colorStats[color].largestRegion
    return scores
  }, { R: 0, Y: 0, G: 0, B: 0 })
}

export function finalScore(board: Board): number {
  return analyzeBoard(board).totalScore
}
