import { useCallback, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { GameCanvas } from './GameCanvas'
import { ScoreBoard } from './ScoreBoard'
import { StartOverlay } from './StartOverlay'
import { GameOverDialog } from './GameOverDialog'
import { useGameLoop } from '@/hooks/useGameLoop'
import { useKeyboard } from '@/hooks/useKeyboard'
import { useHighscore } from '@/hooks/useHighscore'
import {
  INITIAL_TICK_MS,
  MIN_TICK_MS,
  SPEED_INCREASE_EVERY,
  SPEED_FACTOR,
} from '@/game/constants'
import { applyDirection, createInitialState, tick } from '@/game/engine'
import type { Direction, GameState, Phase } from '@/game/types'
import { playEat, playGameOver } from '@/game/sound'

export function SnakeGame() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [score, setScore] = useState<number>(0)
  const [tickMs, setTickMs] = useState<number>(INITIAL_TICK_MS)
  const [isNewHighscore, setIsNewHighscore] = useState<boolean>(false)

  const { highscore, submitScore } = useHighscore()
  const stateRef = useRef<GameState>(createInitialState())
  const scoreRef = useRef<number>(0)

  const reset = useCallback(() => {
    stateRef.current = createInitialState()
    scoreRef.current = 0
    setScore(0)
    setTickMs(INITIAL_TICK_MS)
    setIsNewHighscore(false)
  }, [])

  const onTick = useCallback(() => {
    const result = tick(stateRef.current)
    stateRef.current = result.state

    if (result.ateFood) {
      playEat()
      scoreRef.current += 1
      setScore(scoreRef.current)
      if (scoreRef.current % SPEED_INCREASE_EVERY === 0) {
        setTickMs(ms => Math.max(MIN_TICK_MS, Math.round(ms * SPEED_FACTOR)))
      }
    }

    if (result.collided) {
      playGameOver()
      const beaten = submitScore(scoreRef.current)
      setIsNewHighscore(beaten)
      setPhase('over')
    }
  }, [submitScore])

  const onDirection = useCallback((d: Direction) => {
    if (phase !== 'running') return
    stateRef.current = applyDirection(stateRef.current, d)
  }, [phase])

  const onSpace = useCallback(() => {
    if (phase === 'idle') {
      reset()
      setPhase('running')
    } else if (phase === 'running') {
      setPhase('paused')
    } else if (phase === 'paused') {
      setPhase('running')
    } else if (phase === 'over') {
      reset()
      setPhase('running')
    }
  }, [phase, reset])

  useKeyboard({ onDirection, onSpace })
  useGameLoop({
    isRunning: phase === 'running',
    tickMs,
    onTick,
  })

  return (
    <Card className="bg-slate-900/60 border-slate-800 p-6 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
      <ScoreBoard score={score} highscore={highscore} />
      <div className="relative">
        <GameCanvas stateRef={stateRef} />
        {(phase === 'idle' || phase === 'paused') && <StartOverlay phase={phase} />}
      </div>
      <GameOverDialog
        open={phase === 'over'}
        score={score}
        isNewHighscore={isNewHighscore}
        isWin={stateRef.current.isWon}
        onRestart={onSpace}
      />
    </Card>
  )
}
