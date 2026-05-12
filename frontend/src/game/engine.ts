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
