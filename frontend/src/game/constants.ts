export const GRID_SIZE = 20
export const CELL_PX = 30
export const CANVAS_PX = GRID_SIZE * CELL_PX // 600

export const INITIAL_TICK_MS = 125
export const MIN_TICK_MS = 60
export const SPEED_INCREASE_EVERY = 5   // every N points
export const SPEED_FACTOR = 0.95        // 5% faster per step

export const COLORS = {
  background: '#020617',  // slate-950
  grid: 'rgba(30, 41, 59, 0.4)', // slate-800
  snakeBody: '#22d3ee',   // cyan-400
  snakeHead: '#67e8f9',   // cyan-300
  food: '#d946ef',        // fuchsia-500
  glowCyan: '#22d3ee',
  glowFuchsia: '#d946ef',
} as const

export const OPPOSITE: Record<import('./types').Direction, import('./types').Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}
