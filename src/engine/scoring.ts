import {
  Board,
  COLORS,
  Color,
  MINI_GRID_DIMENSION,
} from './types'

export type MiniCell = Color | null
export type MiniGrid = MiniCell[][]

export function expandBoardToMiniGrid(board: Board): MiniGrid {
  const grid = Array.from({ length: MINI_GRID_DIMENSION }, () =>
    Array<MiniCell>(MINI_GRID_DIMENSION).fill(null),
  )

  board.forEach((tile, slotIndex) => {
    if (!tile) return

    const slotRow = Math.floor(slotIndex / 4)
    const slotColumn = slotIndex % 4

    for (let miniRow = 0; miniRow < 2; miniRow += 1) {
      for (let miniColumn = 0; miniColumn < 2; miniColumn += 1) {
        grid[slotRow * 2 + miniRow][slotColumn * 2 + miniColumn] =
          tile.colors[miniRow][miniColumn]
      }
    }
  })

  return grid
}

export function largestConnectedRegion(grid: MiniGrid, color: Color): number {
  const visited = new Set<string>()
  let largest = 0

  for (let row = 0; row < grid.length; row += 1) {
    for (let column = 0; column < grid[row].length; column += 1) {
      const startKey = `${row},${column}`
      if (grid[row][column] !== color || visited.has(startKey)) continue

      const queue: Array<[number, number]> = [[row, column]]
      visited.add(startKey)
      let regionSize = 0

      while (queue.length > 0) {
        const [currentRow, currentColumn] = queue.shift()!
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

      largest = Math.max(largest, regionSize)
    }
  }

  return largest
}

export function scoreByColor(board: Board): Record<Color, number> {
  const grid = expandBoardToMiniGrid(board)
  return COLORS.reduce<Record<Color, number>>(
    (scores, color) => ({
      ...scores,
      [color]: largestConnectedRegion(grid, color),
    }),
    { R: 0, Y: 0, G: 0, B: 0 },
  )
}

export function finalScore(board: Board): number {
  return Object.values(scoreByColor(board))
    .sort((first, second) => second - first)
    .slice(0, 2)
    .reduce((total, score) => total + score, 0)
}
