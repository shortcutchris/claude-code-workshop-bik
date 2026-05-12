import { useEffect, useRef } from 'react'
import { CANVAS_PX, CELL_PX, COLORS, GRID_SIZE } from '@/game/constants'
import type { GameState } from '@/game/types'

type Props = {
  stateRef: React.MutableRefObject<GameState>
}

export function GameCanvas({ stateRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function draw() {
      const s = stateRef.current
      ctx.fillStyle = COLORS.background
      ctx.fillRect(0, 0, CANVAS_PX, CANVAS_PX)

      // subtle grid
      ctx.strokeStyle = COLORS.grid
      ctx.lineWidth = 1
      for (let i = 1; i < GRID_SIZE; i++) {
        ctx.beginPath()
        ctx.moveTo(i * CELL_PX, 0)
        ctx.lineTo(i * CELL_PX, CANVAS_PX)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, i * CELL_PX)
        ctx.lineTo(CANVAS_PX, i * CELL_PX)
        ctx.stroke()
      }

      // food with pulsing glow
      const pulse = Math.sin(performance.now() / 200) * 5 + 15
      ctx.shadowBlur = pulse
      ctx.shadowColor = COLORS.glowFuchsia
      ctx.fillStyle = COLORS.food
      drawCell(ctx, s.food.x, s.food.y)

      // snake body
      ctx.shadowBlur = 15
      ctx.shadowColor = COLORS.glowCyan
      for (let i = s.snake.length - 1; i >= 0; i--) {
        ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snakeBody
        drawCell(ctx, s.snake[i].x, s.snake[i].y)
      }

      ctx.shadowBlur = 0
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [stateRef])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_PX}
      height={CANVAS_PX}
      className="rounded-md border border-slate-800"
    />
  )
}

function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const px = x * CELL_PX
  const py = y * CELL_PX
  ctx.fillRect(px + 1, py + 1, CELL_PX - 2, CELL_PX - 2)
}
