import {
  COLOR_LABELS,
  COLORS,
  Color,
  GameState,
  countTiles,
  scoreByColor,
} from '../engine'

const COLOR_CLASS: Record<Color, string> = {
  R: 'score-red',
  Y: 'score-yellow',
  G: 'score-green',
  B: 'score-blue',
}

const PHASE_LABELS: Record<GameState['phase'], string> = {
  placement: 'Placement',
  sliding: 'Sliding',
  finished: 'Finished',
}

export function GameHUD({ state }: { state: GameState }) {
  const scores = scoreByColor(state.board)

  return (
    <section className="game-hud" aria-label="Game status">
      <div className="status-row">
        <div className="status-card">
          <span>Phase</span>
          <strong>{PHASE_LABELS[state.phase]}</strong>
        </div>
        <div className="status-card">
          <span>Tiles</span>
          <strong>{countTiles(state.board)} / 15</strong>
        </div>
        <div className="status-card">
          <span>Slides</span>
          <strong>Unlimited</strong>
        </div>
      </div>

      <div className="score-strip" aria-label="Largest color regions">
        {COLORS.map((color) => (
          <div key={color} className={`score-chip ${COLOR_CLASS[color]}`}>
            <span>{COLOR_LABELS[color]}</span>
            <strong>{scores[color]}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}
