import { SnakeGame } from '@/components/SnakeGame'

function App() {
  return (
    <div className="min-h-full flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-3xl font-mono font-bold text-cyan-300 tracking-widest">
          SNAKE
        </h1>
        <SnakeGame />
      </div>
    </div>
  )
}

export default App
