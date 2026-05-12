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
