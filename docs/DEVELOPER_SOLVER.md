# Developer Solver

## Scope and terminology

The Developer Solver is a deterministic, budgeted high-score search. It proves that its returned board is reachable through legal sliding, but it does **not** enumerate the 15-puzzle state space and does **not** prove a global optimum.

Use these terms:

- `bestScoreFound`: the highest canonical score found by this configured search run;
- `verifiedReachable`: the move replay recreated the claimed board and score;
- `searchBudgetReached`: the time or visited-state budget stopped the run;
- `searchCompleted`: the configured beam-search procedure reached its depth limit or exhausted its retained frontier without hitting a budget.

`searchCompleted` never means every reachable state was searched.

## Frozen sliding representation

`SlidingState` contains one ordered `Board` and nothing else:

```ts
interface SlidingState {
  readonly board: readonly (Tile | null)[];
}
```

The board has exactly 16 positions, 15 unique tile IDs, and one `null` empty position. Each tile owns its immutable 2×2 color pattern. React state, draft selection, animation state, onboarding state, and solver progress are excluded.

When placement 15 completes, `GameState.slidingInitialState` receives a defensive snapshot. Normal slides update `GameState.board` but never update that snapshot. Submit and Keep Trying also preserve it.

Authoritative engine functions:

- `isValidSlidingBoard` / `isSlidingState`: board and state validation;
- `getLegalMoves`: all and only orthogonally adjacent slides;
- `isLegalMove`: exact move validation;
- `applyMove`: immutable canonical transition;
- `analyzeBoard`: full color components and top-two score;
- `getSlidingStateKey`: arrangement-only visited-state key;
- `getSlidingPuzzleKey`: initial arrangement plus immutable tile-catalog identity.

Gameplay wrappers such as `canSlide` and `slideTile` delegate to the same move API. The solver and verifier do not reimplement movement.

## Scoring analysis

`analyzeBoard` expands the 4×4 board into the effective 8×8 mini-cell grid. The empty slot contributes four empty cells. For every color it records all orthogonally connected component sizes and the largest component. `totalScore` is the sum of the two largest per-color regions, exactly matching the live game score.

## Search algorithm and heuristic

The first solver uses deterministic beam search:

1. start from `slidingInitialState`;
2. generate moves with `getLegalMoves`;
3. skip the immediate reversal of the preceding move;
4. deduplicate arrangements with `getSlidingStateKey`;
5. retain the strongest configured-width frontier;
6. stop at the time, state, or depth budget.

Canonical total score dominates ranking. Secondary tie-breakers reward strong first and second color regions, matching colors across tile edges, and fewer disconnected components. A seeded state hash gives stable tie ordering. Heuristic rank is never shown as a score.

The conservative app configuration is 500 ms, 12,000 states, beam width 96, and depth 80. The time limit is a safety ceiling, so the exact number of explored states can vary by device. Move ordering and state-budget behavior are deterministic for identical inputs and options.

## Verification

`verifySolverResult` starts from the preserved initial state and replays every move through `isLegalMove` and `applyMove`. It then checks:

1. every move was legal;
2. the replayed board, tile IDs, and color patterns equal `bestState`;
3. `analyzeBoard(replayedBoard).totalScore` equals `bestScoreFound`.

`verifyDeveloperSolverResult` additionally checks the exact puzzle key. The worker verifies before returning, and the main thread verifies again before accepting a result. A failure is logged for development and treated as “no verified result” by the UI.

## Non-blocking lifecycle

The solver runs in a dedicated Vite Web Worker as soon as the sliding phase starts. Sliding, scoring, and Submit remain responsive on the main thread. Beginning another puzzle terminates the previous worker, clears its session, and keys all accepted results to the new `slidingInitialState`.

Development builds log the puzzle key, initial and best-found scores, explored states, elapsed time, move count, verification, budget flags, and configuration. They do not log the player-facing solution path. Automated tests can inspect the path directly.

## End-game rules

- Verified solver score above the submitted score: show the numeric reachable score and invite another attempt.
- Equal score: say the player matched the best result found so far; never claim optimality.
- Player score above the solver: celebrate that the player beat the solver's best found score.
- Missing, stale, or failed verification: show a nonnumeric exploration fallback.

Keep Trying changes `finished` back to `sliding` without changing the submitted board or initial snapshot. Sliding remains unlimited and the player can Submit repeatedly. New Game creates a different seed and invalidates solver/end-game state.

## Benchmark and limitations

Run:

```bash
npm run benchmark:solver
```

The benchmark covers three completed seeded boards and quick, balanced, and app-default configurations. It reports the configured time, beam width, states, initial score, best score found, path length, verification, elapsed time, and budget status.

Known limitations:

- beam pruning can discard a path that later becomes stronger;
- a higher score may exist beyond the time, state, or depth budget;
- wall-clock limits can stop different devices at different state counts;
- no optimality certificate is produced;
- the current heuristic does not estimate the exact number of moves required to merge distant color components.

Future solvers can replace the heuristic, add deterministic restarts, persist verified puzzle-keyed results, or add stronger search strategies without changing the canonical engine or truthfulness rules.
