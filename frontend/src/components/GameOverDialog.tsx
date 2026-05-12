import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  open: boolean
  score: number
  isNewHighscore: boolean
  isWin: boolean
  onRestart: () => void
}

export function GameOverDialog({ open, score, isNewHighscore, isWin, onRestart }: Props) {
  return (
    <Dialog open={open}>
      <DialogContent className="bg-slate-900 border border-cyan-500/40 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-2xl text-cyan-300 font-mono">
            {isWin ? 'You won! 🏆' : 'Game Over'}
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Final score: <span className="text-cyan-300 font-bold">{score}</span>
            {isNewHighscore && (
              <span className="block mt-2 text-fuchsia-400 font-bold">
                New Highscore! 🎉
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onRestart} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
            Play again (Space)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
