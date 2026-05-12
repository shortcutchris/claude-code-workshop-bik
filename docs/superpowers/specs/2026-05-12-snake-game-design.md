# Snake Game — Design

**Date:** 2026-05-12
**Status:** Approved (verbal)
**Owner:** Chris (BIK Workshop)

## 1. Purpose & Scope

Build a simple, polished **Snake game** as a workshop demo. Pure frontend (React + TypeScript + Vite + Tailwind + shadcn/ui), no backend. Goal: a small, end-to-end React project that demonstrates Canvas-in-React, custom hooks, pure game logic, and `localStorage` persistence — all in a visually striking neon/arcade style.

### In Scope (MVP+)

- 20×20 grid, snake + food, keyboard control, score, game-over, restart
- Persistent highscore via `localStorage`
- Pause/resume (Space)
- Procedural sound effects (Web Audio API) for eat + game-over
- Start screen ("Press SPACE to start")
- Progressive difficulty (tickrate decreases as score grows)
- Neon/arcade visual style (cyan snake on dark background, fuchsia food, glow effects)

### Out of Scope

- Backend / global leaderboards
- Touch / swipe controls (desktop only)
- Multiple difficulty presets / settings menu
- Sound asset files (procedural audio only)
- Mobile-responsive scaling
- E2E tests (visual verification is sufficient for MVP)

## 2. Architecture

### 2.1 Game Loop Pattern

`requestAnimationFrame` (RAF) loop running outside React's render cycle. Mutable game state lives in `useRef`; only player-visible state (`phase`, `score`, `highscore`) lives in `useState`. This avoids 8–15 re-renders per second.

**Rationale:** standard pattern for Canvas-based games in React. `setInterval` + `useReducer` was considered but rejected — every tick would trigger a full re-render, and Canvas drawing happens outside React anyway.

### 2.2 Engine = Pure Functions

All game rules live in `src/game/engine.ts` as pure functions:

- `tick(state: GameState): GameState` — advance one step
- `checkCollision(snake: Position[], gridSize: number): boolean`
- `spawnFood(snake: Position[], gridSize: number): Position`
- `applyDirection(snake, direction): Position[]`

This makes the game logic trivially unit-testable with Vitest and keeps React components free of game rules.

### 2.3 Component Tree

```
App
└── SnakeGame                    (orchestrates phase, score, highscore)
    ├── ScoreBoard               (live score + highscore badge)
    ├── GameCanvas               (canvas + RAF loop, takes refs)
    ├── StartOverlay             (visible when phase === 'idle')
    └── GameOverDialog           (shadcn Dialog, visible when phase === 'over')
```

## 3. Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn-generated: button, card, dialog, badge
│   │   ├── SnakeGame.tsx
│   │   ├── GameCanvas.tsx
│   │   ├── ScoreBoard.tsx
│   │   ├── StartOverlay.tsx
│   │   └── GameOverDialog.tsx
│   ├── game/
│   │   ├── engine.ts              # pure tick/collision/spawn functions
│   │   ├── types.ts               # Snake, Position, Direction, GameState, Phase
│   │   ├── constants.ts           # GRID_SIZE=20, CELL_PX=30, INITIAL_TICK_MS=125
│   │   └── sound.ts               # Web Audio API: playEat(), playGameOver()
│   ├── hooks/
│   │   ├── useGameLoop.ts         # RAF + time accumulator → tick callback
│   │   ├── useKeyboard.ts         # direction + control keys
│   │   └── useHighscore.ts        # localStorage get/set
│   ├── lib/
│   │   └── utils.ts               # shadcn cn() helper
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                  # Tailwind directives
├── public/
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── vite.config.ts
├── components.json                # shadcn config
└── package.json
```

## 4. Data Flow

1. **`SnakeGame`** holds `phase` (`'idle' | 'running' | 'paused' | 'over'`), `score`, `highscore` in `useState`.
2. **`SnakeGame`** also holds a `gameStateRef: MutableRefObject<GameState>` containing `{ snake: Position[], food: Position, direction: Direction, nextDirection: Direction }`.
3. **`useGameLoop`** runs `requestAnimationFrame`, accumulates elapsed time. When `accumulator >= currentTickMs`:
   - Call `engine.tick(gameStateRef.current)` → new state
   - If food eaten: `setScore(s => s + 1)`, `sound.playEat()`, reduce `currentTickMs` by 5% every 5 points (floor 60ms)
   - If collision: `setPhase('over')`, `sound.playGameOver()`, update highscore if beaten
4. **`GameCanvas`** also runs in RAF: each frame, read from `gameStateRef`, redraw canvas (clear + draw snake + draw food).
5. **`useKeyboard`** dispatches:
   - Arrow / WASD → write `nextDirection` to ref (180° reverse blocked)
   - Space → state transitions based on `phase`

### 4.1 Phase Transitions

```
idle    --Space-->        running
running --Space-->        paused
paused  --Space-->        running
running --collision-->    over
over    --Space-->        idle (reset state) → next Space starts
```

## 5. Visual Style (Neon / Arcade)

**Palette (Tailwind tokens):**

- Background: `slate-950` (`#020617`)
- Grid lines (optional, very subtle): `slate-800` at 30% opacity
- Snake body: `cyan-400` (`#22d3ee`) with `ctx.shadowBlur = 15`, `shadowColor = 'cyan'`
- Snake head: `cyan-300` (slightly brighter)
- Food: `fuchsia-500` (`#d946ef`) with pulsing `shadowBlur` driven by `Math.sin(performance.now() / 200) * 5 + 15`
- UI text accents: `cyan-300` for score, `fuchsia-400` for "New Highscore!"

**Canvas:** 600×600 px (20 cells × 30 px). Drawn cells leave a 2 px gap (28 px filled square inside 30 px cell) so the grid stays readable even with glow.

**Page layout:** centered Card (shadcn) on `slate-950` page, Card contains ScoreBoard above the canvas, both have generous padding. Looks like an arcade cabinet screen.

## 6. Sound

**Web Audio API**, no asset files. Single `AudioContext` lazily initialized on first user interaction (the Space-to-start press), which satisfies the browser autoplay policy.

- `playEat()`: `OscillatorNode` (sine, 800 Hz) → `GainNode` (linear ramp 0.2 → 0 over 60 ms) → destination
- `playGameOver()`: `OscillatorNode` (sawtooth, frequency ramps 400 → 100 Hz over 300 ms) → `GainNode` (0.3 → 0 over 300 ms) → destination

Both functions guard against `AudioContext.state === 'suspended'` and call `resume()` if needed.

## 7. Highscore Persistence

- `localStorage` key: `snake.highscore.v1` (versioned for future schema changes)
- Value: stringified number
- Read on `SnakeGame` mount via `useHighscore`, write only when current score exceeds stored value
- Invalid/missing → fall back to `0`

## 8. Controls

| Key | Idle | Running | Paused | Over |
|---|---|---|---|---|
| `Space` | Start | Pause | Resume | Reset to idle |
| `↑` / `W` | — | Direction: up | — | — |
| `↓` / `S` | — | Direction: down | — | — |
| `←` / `A` | — | Direction: left | — | — |
| `→` / `D` | — | Direction: right | — | — |

180° reversal is blocked at the input layer (e.g., snake moving right ignores left input).

## 9. Edge Cases

- **180° reverse:** Input is compared against the **last committed `direction`** (not the buffered `nextDirection`) and rejected if it would reverse. This prevents the classic rapid-keys bug: snake going right, user quickly hits down then left between ticks — without this rule, "down" would buffer, then "left" (vs. buffered "down") would be 90° and accepted, and on next tick snake reverses right→left and self-collides. By comparing against `direction`, "left vs. right" is correctly blocked.
- **Tab unfocused:** RAF pauses automatically in background tabs (browser default). On refocus, time accumulator resets to avoid burst of catch-up ticks.
- **Food spawn collision:** `spawnFood` picks random cell from the set of cells *not occupied by snake* (compute free-cell array, pick uniform random index). Prevents pathological retry loops.
- **Snake fills entire grid:** Win condition. `phase → 'over'`, but Dialog shows "You won! 🏆" headline instead of "Game Over".
- **localStorage disabled:** `useHighscore` try/catches; silently degrades to in-memory highscore (resets on reload).

## 10. Testing

**Unit tests (Vitest) for `src/game/engine.ts`:**

- `tick`: snake moves in current direction, grows when eating food, food gets respawned
- `checkCollision`: wall, self-collision, no false positives on adjacent cells
- `spawnFood`: never spawns on snake; covers all free cells over many runs
- `applyDirection`: 180° reverse blocked
- Win condition: snake fills grid → next tick returns `phase: 'over'` with win flag

**No tests for:**

- Canvas rendering (visual verification)
- RAF loop hook (orchestration, hard to test, low risk)
- Sound (manual verification)

## 11. Build & Setup

Per repo `CLAUDE.md`:

```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install -D tailwindcss @tailwindcss/vite vitest @vitest/ui jsdom
npm install lucide-react
npx shadcn@latest init
npx shadcn@latest add button card dialog badge
```

Path alias `@/*` configured in `tsconfig.json` and `vite.config.ts`.

## 12. Open Questions / Deferred

None for MVP. Future-friendly extensions (not in scope, but design allows):

- Add backend Highscore API → swap `useHighscore` implementation only
- Add touch controls → new `useTouch` hook, no engine changes
- Add settings menu → wrap `INITIAL_TICK_MS` in state, surface as UI

## 13. Acceptance Criteria

- [ ] Page loads; centered Card with "Press SPACE to start" overlay visible
- [ ] Snake responds to Arrow keys and WASD; cannot reverse 180°
- [ ] Eating food: score increments, snake grows, eat sound plays, food respawns off-snake
- [ ] Wall + self-collision triggers game-over dialog with score
- [ ] Game-over dialog shows "New Highscore!" when applicable
- [ ] Highscore persists across page reloads
- [ ] Pause (Space) freezes game; Resume (Space) continues from same state
- [ ] Tickrate decreases noticeably after eating 5/10/15 food items
- [ ] Visual: cyan snake glows, fuchsia food pulses, dark background — feels "arcade"
- [ ] All engine unit tests pass
