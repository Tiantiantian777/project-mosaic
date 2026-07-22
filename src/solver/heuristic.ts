import {
  BOARD_DIMENSION,
  BoardAnalysis,
  Color,
  SlidingState,
  analyzeBoard,
} from '../engine'

export interface HeuristicBreakdown {
  readonly rank: number
  readonly totalScore: number
  readonly strongestRegion: number
  readonly secondRegion: number
  readonly componentCount: number
  readonly matchingTileEdges: number
}

function seededHash(value: string, seed: number): number {
  let hash = (2166136261 ^ seed) >>> 0
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function countMatchingTileEdges(state: SlidingState): number {
  let matches = 0

  state.board.forEach((tile, index) => {
    if (!tile) return
    const row = Math.floor(index / BOARD_DIMENSION)
    const column = index % BOARD_DIMENSION

    if (column < BOARD_DIMENSION - 1) {
      const right = state.board[index + 1]
      if (right) {
        if (tile.colors[0][1] === right.colors[0][0]) matches += 1
        if (tile.colors[1][1] === right.colors[1][0]) matches += 1
      }
    }

    if (row < BOARD_DIMENSION - 1) {
      const below = state.board[index + BOARD_DIMENSION]
      if (below) {
        if (tile.colors[1][0] === below.colors[0][0]) matches += 1
        if (tile.colors[1][1] === below.colors[0][1]) matches += 1
      }
    }
  })

  return matches
}

function componentCount(analysis: BoardAnalysis): number {
  return (Object.keys(analysis.colorStats) as Color[]).reduce(
    (total, color) => total + analysis.colorStats[color].componentSizes.length,
    0,
  )
}

/**
 * The canonical Mosaic score is the primary signal. Tie-breakers favor larger
 * leading regions, matching edges across tile boundaries, and fewer disconnected
 * components. A seeded hash only provides deterministic tie ordering.
 */
export function evaluateHeuristic(
  state: SlidingState,
  stateKey: string,
  seed: number,
  analysis = analyzeBoard(state.board),
): HeuristicBreakdown {
  const regionScores = Object.values(analysis.colorStats)
    .map((stats) => stats.largestRegion)
    .sort((first, second) => second - first)
  const strongestRegion = regionScores[0] ?? 0
  const secondRegion = regionScores[1] ?? 0
  const components = componentCount(analysis)
  const matchingTileEdges = countMatchingTileEdges(state)
  const tieBreak = seededHash(stateKey, seed) / 0xffffffff
  const rank =
    analysis.totalScore * 1000 +
    strongestRegion * 25 +
    secondRegion * 10 +
    matchingTileEdges * 3 -
    components * 2 +
    tieBreak

  return {
    rank,
    totalScore: analysis.totalScore,
    strongestRegion,
    secondRegion,
    componentCount: components,
    matchingTileEdges,
  }
}
