import { useEffect, useRef } from 'react'

type Options = {
  isRunning: boolean
  tickMs: number          // current target ms between ticks
  onTick: () => void
  onFrame?: () => void    // called every animation frame (for canvas redraw)
}

export function useGameLoop({ isRunning, tickMs, onTick, onFrame }: Options): void {
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef<number>(0)
  const accumRef = useRef<number>(0)
  const tickMsRef = useRef<number>(tickMs)
  const onTickRef = useRef(onTick)
  const onFrameRef = useRef(onFrame)

  // keep refs in sync with latest props
  tickMsRef.current = tickMs
  onTickRef.current = onTick
  onFrameRef.current = onFrame

  useEffect(() => {
    if (!isRunning) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastRef.current = 0
      accumRef.current = 0
      return
    }

    function frame(now: number) {
      if (lastRef.current === 0) lastRef.current = now
      const dt = now - lastRef.current
      lastRef.current = now

      // guard against long tab-unfocus bursts
      if (dt > 1000) {
        accumRef.current = 0
      } else {
        accumRef.current += dt
      }

      while (accumRef.current >= tickMsRef.current) {
        onTickRef.current()
        accumRef.current -= tickMsRef.current
      }

      onFrameRef.current?.()
      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [isRunning])
}
