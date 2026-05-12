# Snake Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished neon-arcade Snake game (React + TypeScript + Tailwind + shadcn/ui) with keyboard control, persistent highscore via `localStorage`, procedural Web Audio sound, pause/resume, and progressive difficulty. Pure frontend, no backend.

**Architecture:** `requestAnimationFrame` loop drives a pure-TS game engine. Mutable game state lives in `useRef`, only `phase`/`score`/`highscore` in `useState` (avoids re-render storm). Engine functions are pure → trivially Vitest-testable. Canvas drawing via 2D context with `shadowBlur` for glow.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind v4 (`@tailwindcss/vite`), shadcn/ui (button, card, dialog, badge), Vitest + jsdom for unit tests, Web Audio API for sound.

**Spec:** [`docs/superpowers/specs/2026-05-12-snake-game-design.md`](../specs/2026-05-12-snake-game-design.md)

---

## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                       # shadcn-generated
│   │   ├── SnakeGame.tsx             # phase + score state, orchestrates everything
│   │   ├── GameCanvas.tsx            # <canvas> + RAF draw loop
│   │   ├── ScoreBoard.tsx            # score + highscore badge
│   │   ├── StartOverlay.tsx          # "Press SPACE to start" overlay
│   │   └── GameOverDialog.tsx        # shadcn Dialog, restart button
│   ├── game/
│   │   ├── types.ts                  # Position, Direction, Phase, GameState, TickResult
│   │   ├── constants.ts              # GRID_SIZE, CELL_PX, INITIAL_TICK_MS, COLORS
│   │   ├── engine.ts                 # pure: createInitialState, applyDirection, checkCollision, spawnFood, tick
│   │   └── sound.ts                  # Web Audio: playEat, playGameOver
│   ├── hooks/
│   │   ├── useGameLoop.ts            # RAF + time accumulator → onTick
│   │   ├── useKeyboard.ts            # arrow/WASD/space handlers
│   │   └── useHighscore.ts           # localStorage get/set
│   ├── lib/utils.ts                  # shadcn cn() helper (auto-generated)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                     # @import "tailwindcss";
├── tests/                            # Vitest specs (mirror src/ structure)
├── index.html
├── vite.config.ts
├── tsconfig.json, tsconfig.node.json, tsconfig.app.json
├── vitest.config.ts
├── components.json                   # shadcn
└── package.json
```

---

## Task 1: Bootstrap Vite + React + TS in `frontend/`

**Files:**
- Create: `frontend/` (entire Vite scaffold)
- Modify: `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/tsconfig.app.json`

- [ ] **Step 1: Scaffold Vite project**

From repo root:

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

- [ ] **Step 2: Install runtime deps**

```bash
npm install lucide-react clsx tailwind-merge class-variance-authority
```

- [ ] **Step 3: Add path alias `@/*` to TS config**

Edit `frontend/tsconfig.json` — add a `compilerOptions` block at the top level (alongside the `references` array):

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Edit `frontend/tsconfig.app.json` — add the same `baseUrl` and `paths` to its `compilerOptions`:

```json
"baseUrl": ".",
"paths": {
  "@/*": ["./src/*"]
}
```

- [ ] **Step 4: Add path alias to Vite**

Replace `frontend/vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 5: Verify dev server boots**

```bash
cd frontend && npm run dev
```

Expected: Vite prints `Local: http://localhost:5173/`, default React+Vite page loads in browser. Stop with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
cd ..
git add frontend/
git commit -m "chore: bootstrap vite + react + ts frontend"
```

---

## Task 2: Add Tailwind CSS v4

**Files:**
- Modify: `frontend/vite.config.ts`, `frontend/src/index.css`, `frontend/package.json`

- [ ] **Step 1: Install Tailwind v4 + Vite plugin**

```bash
cd frontend
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Register the Tailwind plugin in `vite.config.ts`**

Replace `frontend/vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Replace `src/index.css` with Tailwind import + dark base**

Replace `frontend/src/index.css` contents entirely:

```css
@import "tailwindcss";

:root {
  color-scheme: dark;
}

html, body, #root {
  height: 100%;
  margin: 0;
  background: #020617;
  color: #e2e8f0;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
```

- [ ] **Step 4: Smoke-test Tailwind in `App.tsx`**

Replace `frontend/src/App.tsx`:

```tsx
function App() {
  return (
    <div className="min-h-full flex items-center justify-center">
      <h1 className="text-4xl font-bold text-cyan-400">Tailwind works</h1>
    </div>
  )
}

export default App
```

Delete `frontend/src/App.css` (no longer used).

- [ ] **Step 5: Verify**

```bash
npm run dev
```

Expected: Browser shows centered cyan "Tailwind works" headline on dark background. Stop server.

- [ ] **Step 6: Commit**

```bash
cd ..
git add frontend/
git commit -m "chore: add tailwind v4 + dark base theme"
```

---

## Task 3: Add shadcn/ui + base components

**Files:**
- Create: `frontend/components.json`, `frontend/src/lib/utils.ts`, `frontend/src/components/ui/{button,card,dialog,badge}.tsx`

- [ ] **Step 1: Init shadcn**

```bash
cd frontend
npx shadcn@latest init
```

Interactive prompts — answer:
- Which style? **Default**
- Which base color? **Slate**
- CSS variables? **Yes**

This creates `components.json` and `src/lib/utils.ts`.

- [ ] **Step 2: Add components**

```bash
npx shadcn@latest add button card dialog badge
```

Creates `src/components/ui/button.tsx`, `card.tsx`, `dialog.tsx`, `badge.tsx`.

- [ ] **Step 3: Smoke-test shadcn Button in `App.tsx`**

Replace `frontend/src/App.tsx`:

```tsx
import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="min-h-full flex items-center justify-center gap-4">
      <h1 className="text-4xl font-bold text-cyan-400">Hello</h1>
      <Button>shadcn works</Button>
    </div>
  )
}

export default App
```

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Expected: Cyan headline + styled shadcn button beside it. Stop server.

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/
git commit -m "chore: add shadcn/ui + button card dialog badge"
```

---

## Task 4: Add Vitest + jsdom

**Files:**
- Create: `frontend/vitest.config.ts`, `frontend/tests/sanity.test.ts`
- Modify: `frontend/package.json`

- [ ] **Step 1: Install Vitest deps**

```bash
cd frontend
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Create `vitest.config.ts`**

Create `frontend/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 3: Add test script in `package.json`**

In `frontend/package.json`, add to `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write sanity test**

Create `frontend/tests/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: Verify**

```bash
npm test
```

Expected: `Tests 1 passed (1)`.

- [ ] **Step 6: Commit**

```bash
cd ..
git add frontend/
git commit -m "chore: add vitest + jsdom + sanity test"
```

---

## Task 5: Game types and constants

**Files:**
- Create: `frontend/src/game/types.ts`, `frontend/src/game/constants.ts`

- [ ] **Step 1: Write `types.ts`**

Create `frontend/src/game/types.ts`:

```ts
export type Position = { x: number; y: number }

export type Direction = 'up' | 'down' | 'left' | 'right'

export type Phase = 'idle' | 'running' | 'paused' | 'over'

export type GameState = {
  snake: Position[]          // head is snake[0]
  food: Position
  direction: Direction       // last committed direction
  nextDirection: Direction   // buffered direction for next tick
  isWon: boolean
}

export type TickResult = {
  state: GameState
  ateFood: boolean
  collided: boolean
}
```

- [ ] **Step 2: Write `constants.ts`**

Create `frontend/src/game/constants.ts`:

```ts
export const GRID_SIZE = 20
export const CELL_PX = 30
export const CANVAS_PX = GRID_SIZE * CELL_PX // 600

export const INITIAL_TICK_MS = 125
export const MIN_TICK_MS = 60
export const SPEED_INCREASE_EVERY = 5   // every N points
export const SPEED_FACTOR = 0.95        // 5% faster per step

export const COLORS = {
  background: '#020617',  // slate-950
  grid: 'rgba(30, 41, 59, 0.4)', // slate-800
  snakeBody: '#22d3ee',   // cyan-400
  snakeHead: '#67e8f9',   // cyan-300
  food: '#d946ef',        // fuchsia-500
  glowCyan: '#22d3ee',
  glowFuchsia: '#d946ef',
} as const

export const OPPOSITE: Record<import('./types').Direction, import('./types').Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}
```

- [ ] **Step 3: Commit**

```bash
cd ..
git add frontend/src/game/
git commit -m "feat: add game types and constants"
```

---

## Task 6: Engine — `createInitialState` (TDD)

**Files:**
- Create: `frontend/src/game/engine.ts`, `frontend/tests/game/engine.createInitialState.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/game/engine.createInitialState.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { createInitialState } from '@/game/engine'
import { GRID_SIZE } from '@/game/constants'

describe('createInitialState', () => {
  it('places a snake of length 3 horizontally near center, head pointing right', () => {
    const s = createInitialState()
    expect(s.snake).toHaveLength(3)
    expect(s.direction).toBe('right')
    expect(s.nextDirection).toBe('right')
    expect(s.isWon).toBe(false)
    // head is rightmost segment
    const head = s.snake[0]
    expect(head.x).toBeGreaterThan(s.snake[1].x)
  })

  it('places food on the grid and not on the snake', () => {
    const s = createInitialState()
    expect(s.food.x).toBeGreaterThanOrEqual(0)
    expect(s.food.x).toBeLessThan(GRID_SIZE)
    expect(s.food.y).toBeGreaterThanOrEqual(0)
    expect(s.food.y).toBeLessThan(GRID_SIZE)
    const onSnake = s.snake.some(p => p.x === s.food.x && p.y === s.food.y)
    expect(onSnake).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- engine.createInitialState
```

Expected: FAIL with "Failed to resolve import '@/game/engine'".

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/game/engine.ts`:

```ts
import { GRID_SIZE } from './constants'
import type { GameState, Position } from './types'

export function spawnFood(snake: Position[]): Position {
  const occupied = new Set(snake.map(p => `${p.x},${p.y}`))
  const free: Position[] = []
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y })
    }
  }
  return free[Math.floor(Math.random() * free.length)]
}

export function createInitialState(): GameState {
  const cy = Math.floor(GRID_SIZE / 2)
  const cx = Math.floor(GRID_SIZE / 2)
  const snake: Position[] = [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ]
  return {
    snake,
    food: spawnFood(snake),
    direction: 'right',
    nextDirection: 'right',
    isWon: false,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- engine.createInitialState
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/src/game/engine.ts frontend/tests/
git commit -m "feat(engine): add createInitialState + spawnFood"
```

---

## Task 7: Engine — `spawnFood` thorough tests

**Files:**
- Create: `frontend/tests/game/engine.spawnFood.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/game/engine.spawnFood.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { spawnFood } from '@/game/engine'
import { GRID_SIZE } from '@/game/constants'
import type { Position } from '@/game/types'

describe('spawnFood', () => {
  it('never spawns on the snake', () => {
    const snake: Position[] = [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 5, y: 7 },
    ]
    for (let i = 0; i < 200; i++) {
      const food = spawnFood(snake)
      const onSnake = snake.some(p => p.x === food.x && p.y === food.y)
      expect(onSnake).toBe(false)
    }
  })

  it('only spawns within grid bounds', () => {
    const snake: Position[] = [{ x: 0, y: 0 }]
    for (let i = 0; i < 100; i++) {
      const f = spawnFood(snake)
      expect(f.x).toBeGreaterThanOrEqual(0)
      expect(f.x).toBeLessThan(GRID_SIZE)
      expect(f.y).toBeGreaterThanOrEqual(0)
      expect(f.y).toBeLessThan(GRID_SIZE)
    }
  })

  it('handles snake covering most of the board', () => {
    // 399 cells occupied, 1 free
    const snake: Position[] = []
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (!(x === 10 && y === 10)) snake.push({ x, y })
      }
    }
    const f = spawnFood(snake)
    expect(f).toEqual({ x: 10, y: 10 })
  })
})
```

- [ ] **Step 2: Run test**

```bash
cd frontend && npm test -- engine.spawnFood
```

Expected: PASS (implementation from Task 6 already covers these cases).

- [ ] **Step 3: Commit**

```bash
cd ..
git add frontend/tests/
git commit -m "test(engine): thorough spawnFood coverage"
```

---

## Task 8: Engine — `applyDirection` with 180° block (TDD)

**Files:**
- Modify: `frontend/src/game/engine.ts`
- Create: `frontend/tests/game/engine.applyDirection.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/game/engine.applyDirection.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { applyDirection } from '@/game/engine'
import type { GameState } from '@/game/types'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
    food: { x: 10, y: 10 },
    direction: 'right',
    nextDirection: 'right',
    isWon: false,
    ...overrides,
  }
}

describe('applyDirection', () => {
  it('buffers a perpendicular direction', () => {
    const s = applyDirection(makeState(), 'up')
    expect(s.nextDirection).toBe('up')
    expect(s.direction).toBe('right') // unchanged until next tick
  })

  it('ignores a 180° reverse relative to current direction', () => {
    const s = applyDirection(makeState({ direction: 'right', nextDirection: 'right' }), 'left')
    expect(s.nextDirection).toBe('right')
  })

  it('ignores reverse even if a perpendicular was just buffered', () => {
    // snake going right, user buffered down, then quickly presses left
    // left vs current direction=right → 180° → must be blocked
    const buffered = applyDirection(makeState({ direction: 'right' }), 'down')
    expect(buffered.nextDirection).toBe('down')
    const final = applyDirection(buffered, 'left')
    expect(final.nextDirection).toBe('down') // left blocked, down kept
  })

  it('allows same direction (no-op)', () => {
    const s = applyDirection(makeState({ direction: 'right' }), 'right')
    expect(s.nextDirection).toBe('right')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- engine.applyDirection
```

Expected: FAIL with "applyDirection is not a function" (not exported yet).

- [ ] **Step 3: Implement `applyDirection`**

Append to `frontend/src/game/engine.ts`:

```ts
import { OPPOSITE } from './constants'
import type { Direction } from './types'

export function applyDirection(state: GameState, input: Direction): GameState {
  // Compare against last committed direction, NOT nextDirection
  if (OPPOSITE[state.direction] === input) {
    return state
  }
  return { ...state, nextDirection: input }
}
```

Adjust the existing top-of-file imports — the file should start with:

```ts
import { GRID_SIZE, OPPOSITE } from './constants'
import type { Direction, GameState, Position } from './types'
```

(Combine the import lines; don't have two imports from the same module.)

- [ ] **Step 4: Run test**

```bash
npm test -- engine.applyDirection
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/src/game/engine.ts frontend/tests/
git commit -m "feat(engine): applyDirection with 180-degree reverse block"
```

---

## Task 9: Engine — `checkCollision` (TDD)

**Files:**
- Modify: `frontend/src/game/engine.ts`
- Create: `frontend/tests/game/engine.checkCollision.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/game/engine.checkCollision.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { checkCollision } from '@/game/engine'
import { GRID_SIZE } from '@/game/constants'
import type { Position } from '@/game/types'

describe('checkCollision', () => {
  it('returns true when head is out of bounds (left)', () => {
    const snake: Position[] = [{ x: -1, y: 5 }, { x: 0, y: 5 }]
    expect(checkCollision(snake)).toBe(true)
  })

  it('returns true when head is out of bounds (right)', () => {
    const snake: Position[] = [{ x: GRID_SIZE, y: 5 }]
    expect(checkCollision(snake)).toBe(true)
  })

  it('returns true when head is out of bounds (top/bottom)', () => {
    expect(checkCollision([{ x: 5, y: -1 }])).toBe(true)
    expect(checkCollision([{ x: 5, y: GRID_SIZE }])).toBe(true)
  })

  it('returns true when head overlaps a body segment', () => {
    const snake: Position[] = [
      { x: 5, y: 5 }, // head
      { x: 5, y: 6 },
      { x: 5, y: 7 },
      { x: 5, y: 5 }, // tail wrapped onto head
    ]
    expect(checkCollision(snake)).toBe(true)
  })

  it('returns false for a normal in-bounds snake', () => {
    const snake: Position[] = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }]
    expect(checkCollision(snake)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- engine.checkCollision
```

Expected: FAIL with "checkCollision is not a function".

- [ ] **Step 3: Implement**

Append to `frontend/src/game/engine.ts`:

```ts
export function checkCollision(snake: Position[]): boolean {
  const head = snake[0]
  if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
    return true
  }
  for (let i = 1; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) return true
  }
  return false
}
```

- [ ] **Step 4: Run test**

```bash
npm test -- engine.checkCollision
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/src/game/engine.ts frontend/tests/
git commit -m "feat(engine): checkCollision for walls and self"
```

---

## Task 10: Engine — `tick` (TDD)

**Files:**
- Modify: `frontend/src/game/engine.ts`
- Create: `frontend/tests/game/engine.tick.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/game/engine.tick.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { tick } from '@/game/engine'
import type { GameState } from '@/game/types'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
    food: { x: 10, y: 10 },
    direction: 'right',
    nextDirection: 'right',
    isWon: false,
    ...overrides,
  }
}

describe('tick', () => {
  it('moves snake one cell in current nextDirection and commits direction', () => {
    const r = tick(makeState())
    expect(r.ateFood).toBe(false)
    expect(r.collided).toBe(false)
    expect(r.state.snake[0]).toEqual({ x: 6, y: 5 }) // head moved right
    expect(r.state.snake).toHaveLength(3) // no growth without food
    expect(r.state.direction).toBe('right')
  })

  it('honors nextDirection on the next tick (e.g. up)', () => {
    const r = tick(makeState({ nextDirection: 'up' }))
    expect(r.state.snake[0]).toEqual({ x: 5, y: 4 }) // head moved up
    expect(r.state.direction).toBe('up')
  })

  it('grows the snake and respawns food when eating', () => {
    const state = makeState({
      snake: [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }],
      food: { x: 10, y: 10 },
      direction: 'right',
      nextDirection: 'right',
    })
    const r = tick(state)
    expect(r.ateFood).toBe(true)
    expect(r.collided).toBe(false)
    expect(r.state.snake).toHaveLength(4)
    expect(r.state.snake[0]).toEqual({ x: 10, y: 10 })
    // food respawned somewhere not on snake
    const onSnake = r.state.snake.some(p => p.x === r.state.food.x && p.y === r.state.food.y)
    expect(onSnake).toBe(false)
  })

  it('flags collision when head hits wall', () => {
    const state = makeState({
      snake: [{ x: 19, y: 5 }, { x: 18, y: 5 }, { x: 17, y: 5 }],
      direction: 'right',
      nextDirection: 'right',
    })
    const r = tick(state)
    expect(r.collided).toBe(true)
  })

  it('flags collision when head hits body', () => {
    // body wraps around so head moving left hits body at (4,5)
    const state = makeState({
      snake: [
        { x: 5, y: 5 }, // head
        { x: 6, y: 5 },
        { x: 6, y: 6 },
        { x: 5, y: 6 },
        { x: 4, y: 6 },
        { x: 4, y: 5 }, // tail — head will move left onto this cell
      ],
      direction: 'left',
      nextDirection: 'left',
    })
    // After tick, the snake shifts: tail (4,5) moves off, new head at (4,5).
    // But (4,5) is checked BEFORE the tail moves in our implementation —
    // since checkCollision runs on newSnake which still has the old tail dropped:
    // newSnake = [{4,5}, {5,5}, {6,5}, {6,6}, {5,6}, {4,6}]
    // Head (4,5) is not in the rest → no collision actually.
    // Use a tighter shape where the new head lands on a non-tail body cell:
    const state2 = makeState({
      snake: [
        { x: 5, y: 5 }, // head
        { x: 5, y: 6 },
        { x: 4, y: 6 },
        { x: 4, y: 5 }, // body at (4,5)
        { x: 4, y: 4 }, // tail at (4,4)
      ],
      direction: 'left',
      nextDirection: 'left',
    })
    // head moves to (4,5), tail (4,4) drops →
    // newSnake = [{4,5}, {5,5}, {5,6}, {4,6}, {4,5}] — head collides with body (4,5)
    const r2 = tick(state2)
    expect(r2.collided).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- engine.tick
```

Expected: FAIL with "tick is not a function".

- [ ] **Step 3: Implement `tick`**

Append to `frontend/src/game/engine.ts`:

```ts
import type { TickResult } from './types'

const DELTA: Record<Direction, Position> = {
  up:    { x: 0, y: -1 },
  down:  { x: 0, y: 1 },
  left:  { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export function tick(state: GameState): TickResult {
  const direction = state.nextDirection
  const d = DELTA[direction]
  const head = state.snake[0]
  const newHead: Position = { x: head.x + d.x, y: head.y + d.y }

  const ateFood = newHead.x === state.food.x && newHead.y === state.food.y

  // grow if ate, otherwise drop tail
  const newSnake: Position[] = ateFood
    ? [newHead, ...state.snake]
    : [newHead, ...state.snake.slice(0, -1)]

  const collided = checkCollision(newSnake)

  const newFood = ateFood ? spawnFood(newSnake) : state.food

  return {
    state: {
      ...state,
      snake: newSnake,
      food: newFood,
      direction,
      // nextDirection stays buffered until next applyDirection call
    },
    ateFood,
    collided,
  }
}
```

- [ ] **Step 4: Run all engine tests**

```bash
npm test -- engine
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/src/game/engine.ts frontend/tests/
git commit -m "feat(engine): tick advances snake, handles eat and collide"
```

---

## Task 11: Engine — Win condition (TDD)

**Files:**
- Modify: `frontend/src/game/engine.ts`
- Create: `frontend/tests/game/engine.win.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/game/engine.win.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { tick } from '@/game/engine'
import { GRID_SIZE } from '@/game/constants'
import type { GameState, Position } from '@/game/types'

describe('win condition', () => {
  it('sets isWon=true when snake fills the entire grid by eating', () => {
    // Construct a snake of length GRID_SIZE*GRID_SIZE - 1 (399), food in the
    // last free cell, and the head positioned to eat it next tick.
    const total = GRID_SIZE * GRID_SIZE
    const allCells: Position[] = []
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) allCells.push({ x, y })
    }
    // pick last cell as food, build snake out of the rest with head adjacent to food
    const food = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 }
    // head at (GRID_SIZE - 2, GRID_SIZE - 1), moving right
    const snake: Position[] = allCells
      .filter(c => !(c.x === food.x && c.y === food.y))
      .filter(c => !(c.x === GRID_SIZE - 2 && c.y === GRID_SIZE - 1))
    // prepend head
    snake.unshift({ x: GRID_SIZE - 2, y: GRID_SIZE - 1 })
    expect(snake).toHaveLength(total - 1)

    const state: GameState = {
      snake,
      food,
      direction: 'right',
      nextDirection: 'right',
      isWon: false,
    }
    const r = tick(state)
    expect(r.ateFood).toBe(true)
    expect(r.state.snake).toHaveLength(total)
    expect(r.state.isWon).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- engine.win
```

Expected: FAIL — `isWon` is `false`.

- [ ] **Step 3: Update `tick` to set `isWon` on full board**

In `frontend/src/game/engine.ts`, locate the `tick` function and update the returned `state`:

Replace the `tick` function's return value:

```ts
  const totalCells = GRID_SIZE * GRID_SIZE
  const isWon = newSnake.length === totalCells

  // skip food respawn if board is full (no free cells)
  const respawnedFood = ateFood && !isWon ? spawnFood(newSnake) : state.food

  return {
    state: {
      ...state,
      snake: newSnake,
      food: respawnedFood,
      direction,
      isWon,
    },
    ateFood,
    collided: collided || isWon,
  }
```

Remove the old `newFood` variable and its usage; replace with `respawnedFood` as shown. (`isWon` ends the run, so treat it like a collision for game-loop purposes.)

- [ ] **Step 4: Run all engine tests**

```bash
npm test -- engine
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/src/game/engine.ts frontend/tests/
git commit -m "feat(engine): win condition when snake fills grid"
```

---

## Task 12: Sound module (Web Audio)

**Files:**
- Create: `frontend/src/game/sound.ts`

- [ ] **Step 1: Write `sound.ts`**

Create `frontend/src/game/sound.ts`:

```ts
let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}

export function playEat(): void {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, c.currentTime)
    gain.gain.setValueAtTime(0.2, c.currentTime)
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.06)
    osc.connect(gain).connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + 0.06)
  } catch {
    // audio is best-effort; ignore failures
  }
}

export function playGameOver(): void {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(400, c.currentTime)
    osc.frequency.linearRampToValueAtTime(100, c.currentTime + 0.3)
    gain.gain.setValueAtTime(0.3, c.currentTime)
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.3)
    osc.connect(gain).connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + 0.3)
  } catch {
    // ignore
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ..
git add frontend/src/game/sound.ts
git commit -m "feat: procedural sound effects via web audio api"
```

---

## Task 13: `useHighscore` hook (TDD)

**Files:**
- Create: `frontend/src/hooks/useHighscore.ts`, `frontend/tests/hooks/useHighscore.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/hooks/useHighscore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHighscore } from '@/hooks/useHighscore'

const KEY = 'snake.highscore.v1'

describe('useHighscore', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns 0 when no value is stored', () => {
    const { result } = renderHook(() => useHighscore())
    expect(result.current.highscore).toBe(0)
  })

  it('reads a stored value', () => {
    localStorage.setItem(KEY, '42')
    const { result } = renderHook(() => useHighscore())
    expect(result.current.highscore).toBe(42)
  })

  it('submitScore writes when score exceeds stored value', () => {
    const { result } = renderHook(() => useHighscore())
    act(() => {
      result.current.submitScore(10)
    })
    expect(result.current.highscore).toBe(10)
    expect(localStorage.getItem(KEY)).toBe('10')
  })

  it('submitScore does nothing when score does not exceed stored value', () => {
    localStorage.setItem(KEY, '50')
    const { result } = renderHook(() => useHighscore())
    act(() => {
      result.current.submitScore(20)
    })
    expect(result.current.highscore).toBe(50)
  })

  it('submitScore returns true when a new highscore is set', () => {
    const { result } = renderHook(() => useHighscore())
    let beaten = false
    act(() => {
      beaten = result.current.submitScore(5)
    })
    expect(beaten).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- useHighscore
```

Expected: FAIL with "Failed to resolve import '@/hooks/useHighscore'".

- [ ] **Step 3: Implement**

Create `frontend/src/hooks/useHighscore.ts`:

```ts
import { useCallback, useState } from 'react'

const STORAGE_KEY = 'snake.highscore.v1'

function read(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return 0
    const n = Number.parseInt(raw, 10)
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

export function useHighscore() {
  const [highscore, setHighscore] = useState<number>(() => read())

  const submitScore = useCallback((score: number): boolean => {
    if (score > highscore) {
      try {
        localStorage.setItem(STORAGE_KEY, String(score))
      } catch {
        // ignore — degrades to in-memory only
      }
      setHighscore(score)
      return true
    }
    return false
  }, [highscore])

  return { highscore, submitScore }
}
```

- [ ] **Step 4: Run test**

```bash
npm test -- useHighscore
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/src/hooks/ frontend/tests/
git commit -m "feat(hooks): useHighscore with localStorage persistence"
```

---

## Task 14: `useKeyboard` hook

**Files:**
- Create: `frontend/src/hooks/useKeyboard.ts`

(No unit test — pure window-event wiring, low risk, will be exercised in manual verification.)

- [ ] **Step 1: Write hook**

Create `frontend/src/hooks/useKeyboard.ts`:

```ts
import { useEffect } from 'react'
import type { Direction } from '@/game/types'

type Handlers = {
  onDirection: (d: Direction) => void
  onSpace: () => void
}

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up', W: 'up',
  s: 'down', S: 'down',
  a: 'left', A: 'left',
  d: 'right', D: 'right',
}

export function useKeyboard({ onDirection, onSpace }: Handlers): void {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        onSpace()
        return
      }
      const dir = KEY_TO_DIRECTION[e.key]
      if (dir) {
        e.preventDefault()
        onDirection(dir)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onDirection, onSpace])
}
```

- [ ] **Step 2: Verify TS compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ..
git add frontend/src/hooks/useKeyboard.ts
git commit -m "feat(hooks): useKeyboard for arrows + WASD + space"
```

---

## Task 15: `useGameLoop` hook (RAF + accumulator)

**Files:**
- Create: `frontend/src/hooks/useGameLoop.ts`

(No unit test — RAF orchestration, manually verified.)

- [ ] **Step 1: Write hook**

Create `frontend/src/hooks/useGameLoop.ts`:

```ts
import { useEffect, useRef } from 'react'

type Options = {
  isRunning: boolean
  tickMs: number          // current target ms between ticks
  onTick: () => void
  onFrame?: () => void    // called every animation frame (for canvas redraw)
}

export function useGameLoop({ isRunning, tickMs, onTick, onFrame }: Options): void {
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef<number>(0)
  const accumRef = useRef<number>(0)
  const tickMsRef = useRef<number>(tickMs)
  const onTickRef = useRef(onTick)
  const onFrameRef = useRef(onFrame)

  // keep refs in sync with latest props
  tickMsRef.current = tickMs
  onTickRef.current = onTick
  onFrameRef.current = onFrame

  useEffect(() => {
    if (!isRunning) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastRef.current = 0
      accumRef.current = 0
      return
    }

    function frame(now: number) {
      if (lastRef.current === 0) lastRef.current = now
      const dt = now - lastRef.current
      lastRef.current = now

      // guard against long tab-unfocus bursts
      if (dt > 1000) {
        accumRef.current = 0
      } else {
        accumRef.current += dt
      }

      while (accumRef.current >= tickMsRef.current) {
        onTickRef.current()
        accumRef.current -= tickMsRef.current
      }

      onFrameRef.current?.()
      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [isRunning])
}
```

- [ ] **Step 2: Verify TS compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ..
git add frontend/src/hooks/useGameLoop.ts
git commit -m "feat(hooks): useGameLoop with RAF + time accumulator"
```

---

## Task 16: `GameCanvas` component

**Files:**
- Create: `frontend/src/components/GameCanvas.tsx`

- [ ] **Step 1: Write component**

Create `frontend/src/components/GameCanvas.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import { CANVAS_PX, CELL_PX, COLORS, GRID_SIZE } from '@/game/constants'
import type { GameState } from '@/game/types'

type Props = {
  stateRef: React.MutableRefObject<GameState>
}

export function GameCanvas({ stateRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function draw() {
      const s = stateRef.current
      ctx.fillStyle = COLORS.background
      ctx.fillRect(0, 0, CANVAS_PX, CANVAS_PX)

      // subtle grid
      ctx.strokeStyle = COLORS.grid
      ctx.lineWidth = 1
      for (let i = 1; i < GRID_SIZE; i++) {
        ctx.beginPath()
        ctx.moveTo(i * CELL_PX, 0)
        ctx.lineTo(i * CELL_PX, CANVAS_PX)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, i * CELL_PX)
        ctx.lineTo(CANVAS_PX, i * CELL_PX)
        ctx.stroke()
      }

      // food with pulsing glow
      const pulse = Math.sin(performance.now() / 200) * 5 + 15
      ctx.shadowBlur = pulse
      ctx.shadowColor = COLORS.glowFuchsia
      ctx.fillStyle = COLORS.food
      drawCell(ctx, s.food.x, s.food.y)

      // snake body
      ctx.shadowBlur = 15
      ctx.shadowColor = COLORS.glowCyan
      for (let i = s.snake.length - 1; i >= 0; i--) {
        ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snakeBody
        drawCell(ctx, s.snake[i].x, s.snake[i].y)
      }

      ctx.shadowBlur = 0
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [stateRef])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_PX}
      height={CANVAS_PX}
      className="rounded-md border border-slate-800"
    />
  )
}

function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const px = x * CELL_PX
  const py = y * CELL_PX
  ctx.fillRect(px + 1, py + 1, CELL_PX - 2, CELL_PX - 2)
}
```

- [ ] **Step 2: Verify TS compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ..
git add frontend/src/components/GameCanvas.tsx
git commit -m "feat: GameCanvas with neon glow rendering"
```

---

## Task 17: `ScoreBoard`, `StartOverlay`, `GameOverDialog` components

**Files:**
- Create: `frontend/src/components/ScoreBoard.tsx`, `frontend/src/components/StartOverlay.tsx`, `frontend/src/components/GameOverDialog.tsx`

- [ ] **Step 1: Write `ScoreBoard.tsx`**

Create `frontend/src/components/ScoreBoard.tsx`:

```tsx
import { Badge } from '@/components/ui/badge'

type Props = {
  score: number
  highscore: number
}

export function ScoreBoard({ score, highscore }: Props) {
  return (
    <div className="flex items-center justify-between w-full mb-4">
      <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-base px-3 py-1">
        Score: {score}
      </Badge>
      <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 text-base px-3 py-1">
        Best: {highscore}
      </Badge>
    </div>
  )
}
```

- [ ] **Step 2: Write `StartOverlay.tsx`**

Create `frontend/src/components/StartOverlay.tsx`:

```tsx
type Props = {
  phase: 'idle' | 'paused'
}

export function StartOverlay({ phase }: Props) {
  const text = phase === 'idle' ? 'Press SPACE to start' : 'Paused — SPACE to resume'
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="px-6 py-3 rounded-md bg-slate-950/80 border border-cyan-500/40 text-cyan-300 text-xl font-mono tracking-wider">
        {text}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write `GameOverDialog.tsx`**

Create `frontend/src/components/GameOverDialog.tsx`:

```tsx
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  open: boolean
  score: number
  isNewHighscore: boolean
  isWin: boolean
  onRestart: () => void
}

export function GameOverDialog({ open, score, isNewHighscore, isWin, onRestart }: Props) {
  return (
    <Dialog open={open}>
      <DialogContent className="bg-slate-900 border border-cyan-500/40 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-2xl text-cyan-300 font-mono">
            {isWin ? 'You won! 🏆' : 'Game Over'}
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Final score: <span className="text-cyan-300 font-bold">{score}</span>
            {isNewHighscore && (
              <span className="block mt-2 text-fuchsia-400 font-bold">
                New Highscore! 🎉
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onRestart} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
            Play again (Space)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Verify TS compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/src/components/
git commit -m "feat: ScoreBoard, StartOverlay, GameOverDialog components"
```

---

## Task 18: `SnakeGame` orchestrator + App wire-up

**Files:**
- Create: `frontend/src/components/SnakeGame.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Write `SnakeGame.tsx`**

Create `frontend/src/components/SnakeGame.tsx`:

```tsx
import { useCallback, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { GameCanvas } from './GameCanvas'
import { ScoreBoard } from './ScoreBoard'
import { StartOverlay } from './StartOverlay'
import { GameOverDialog } from './GameOverDialog'
import { useGameLoop } from '@/hooks/useGameLoop'
import { useKeyboard } from '@/hooks/useKeyboard'
import { useHighscore } from '@/hooks/useHighscore'
import {
  INITIAL_TICK_MS,
  MIN_TICK_MS,
  SPEED_INCREASE_EVERY,
  SPEED_FACTOR,
} from '@/game/constants'
import { applyDirection, createInitialState, tick } from '@/game/engine'
import type { Direction, GameState, Phase } from '@/game/types'
import { playEat, playGameOver } from '@/game/sound'

export function SnakeGame() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [score, setScore] = useState<number>(0)
  const [tickMs, setTickMs] = useState<number>(INITIAL_TICK_MS)
  const [isNewHighscore, setIsNewHighscore] = useState<boolean>(false)

  const { highscore, submitScore } = useHighscore()
  const stateRef = useRef<GameState>(createInitialState())
  const scoreRef = useRef<number>(0)

  const reset = useCallback(() => {
    stateRef.current = createInitialState()
    scoreRef.current = 0
    setScore(0)
    setTickMs(INITIAL_TICK_MS)
    setIsNewHighscore(false)
  }, [])

  const onTick = useCallback(() => {
    const result = tick(stateRef.current)
    stateRef.current = result.state

    if (result.ateFood) {
      playEat()
      scoreRef.current += 1
      setScore(scoreRef.current)
      if (scoreRef.current % SPEED_INCREASE_EVERY === 0) {
        setTickMs(ms => Math.max(MIN_TICK_MS, Math.round(ms * SPEED_FACTOR)))
      }
    }

    if (result.collided) {
      playGameOver()
      const beaten = submitScore(scoreRef.current)
      setIsNewHighscore(beaten)
      setPhase('over')
    }
  }, [submitScore])

  const onDirection = useCallback((d: Direction) => {
    if (phase !== 'running') return
    stateRef.current = applyDirection(stateRef.current, d)
  }, [phase])

  const onSpace = useCallback(() => {
    if (phase === 'idle') {
      reset()
      setPhase('running')
    } else if (phase === 'running') {
      setPhase('paused')
    } else if (phase === 'paused') {
      setPhase('running')
    } else if (phase === 'over') {
      reset()
      setPhase('running')
    }
  }, [phase, reset])

  useKeyboard({ onDirection, onSpace })
  useGameLoop({
    isRunning: phase === 'running',
    tickMs,
    onTick,
  })

  return (
    <Card className="bg-slate-900/60 border-slate-800 p-6 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
      <ScoreBoard score={score} highscore={highscore} />
      <div className="relative">
        <GameCanvas stateRef={stateRef} />
        {(phase === 'idle' || phase === 'paused') && <StartOverlay phase={phase} />}
      </div>
      <GameOverDialog
        open={phase === 'over'}
        score={score}
        isNewHighscore={isNewHighscore}
        isWin={stateRef.current.isWon}
        onRestart={onSpace}
      />
    </Card>
  )
}
```

- [ ] **Step 2: Replace `App.tsx`**

Replace `frontend/src/App.tsx`:

```tsx
import { SnakeGame } from '@/components/SnakeGame'

function App() {
  return (
    <div className="min-h-full flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-3xl font-mono font-bold text-cyan-300 tracking-widest">
          SNAKE
        </h1>
        <SnakeGame />
      </div>
    </div>
  )
}

export default App
```

- [ ] **Step 3: Verify TS compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run full test suite**

```bash
npm test
```

Expected: all engine + hook tests PASS.

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/src/
git commit -m "feat: SnakeGame orchestrator wired into App"
```

---

## Task 19: Manual verification + final commit

**Files:** none modified — verification only

- [ ] **Step 1: Start dev server**

```bash
cd frontend && npm run dev
```

- [ ] **Step 2: Verify against acceptance criteria from the spec**

In browser at `http://localhost:5173`:

1. Page loads, centered Card on dark background, "SNAKE" headline above
2. "Press SPACE to start" overlay visible over canvas
3. Press Space → snake starts moving right
4. Arrow keys + WASD change direction; pressing the reverse direction does nothing (snake doesn't self-flip)
5. Eating food: score increments, snake grows, audible beep, food respawns elsewhere
6. After 5 points: snake moves noticeably faster
7. Hit wall or self → "Game Over" dialog appears with score, descending sound plays
8. If beat highscore → dialog also shows "New Highscore! 🎉"
9. Press Space (or click button) on dialog → game resets and runs again
10. Reload page → highscore persists in the Best badge
11. Press Space mid-game → "Paused — SPACE to resume" overlay; press again → resumes from same state
12. Visual: cyan snake glows, fuchsia food pulses

- [ ] **Step 3: Run all tests one more time**

```bash
npm test
```

Expected: ALL PASS.

- [ ] **Step 4: Type-check final**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Stop dev server, push to GitHub**

```bash
cd ..
git push
```

- [ ] **Step 6: Done — share repo URL**

Open `https://github.com/shortcutchris/claude-code-workshop-bik` in browser. Snake game is live in `frontend/`, design + plan documented in `docs/superpowers/`.
