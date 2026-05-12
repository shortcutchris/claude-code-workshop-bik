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
