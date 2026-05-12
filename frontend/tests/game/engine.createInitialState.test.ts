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
