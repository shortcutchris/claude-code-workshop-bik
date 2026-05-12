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
