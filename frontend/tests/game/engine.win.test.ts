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
