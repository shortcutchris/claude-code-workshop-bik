import { GRID_SIZE, OPPOSITE } from './constants'
import type { Direction, GameState, Position, TickResult } from './types'

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

export function applyDirection(state: GameState, input: Direction): GameState {
  // Compare against last committed direction, NOT nextDirection
  if (OPPOSITE[state.direction] === input) {
    return state
  }
  return { ...state, nextDirection: input }
}

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
      // nextDirection stays buffered until next applyDirection call
    },
    ateFood,
    collided: collided || isWon,
  }
}
