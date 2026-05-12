export type Position = { x: number; y: number }

export type Direction = 'up' | 'down' | 'left' | 'right'

export type Phase = 'idle' | 'running' | 'paused' | 'over'

export type GameState = {
  snake: Position[]          // head is snake[0]
  food: Position
  direction: Direction       // last committed direction
  nextDirection: Direction   // buffered direction for next tick
  isWon: boolean
}

export type TickResult = {
  state: GameState
  ateFood: boolean
  collided: boolean
}
