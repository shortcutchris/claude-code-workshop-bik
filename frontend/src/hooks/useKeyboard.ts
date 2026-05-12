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
