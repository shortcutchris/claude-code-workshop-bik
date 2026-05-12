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
