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
