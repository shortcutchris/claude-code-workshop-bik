import { useCallback, useState } from 'react'

const STORAGE_KEY = 'snake.highscore.v1'

function read(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return 0
    const n = Number.parseInt(raw, 10)
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

export function useHighscore() {
  const [highscore, setHighscore] = useState<number>(() => read())

  const submitScore = useCallback(
    (score: number): boolean => {
      if (score > highscore) {
        try {
          localStorage.setItem(STORAGE_KEY, String(score))
        } catch {
          // ignore — degrades to in-memory only
        }
        setHighscore(score)
        return true
      }
      return false
    },
    [highscore],
  )

  return { highscore, submitScore }
}
