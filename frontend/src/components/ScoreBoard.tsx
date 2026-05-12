import { Badge } from '@/components/ui/badge'

type Props = {
  score: number
  highscore: number
}

export function ScoreBoard({ score, highscore }: Props) {
  return (
    <div className="flex items-center justify-between w-full mb-4">
      <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-base px-3 py-1">
        Score: {score}
      </Badge>
      <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 text-base px-3 py-1">
        Best: {highscore}
      </Badge>
    </div>
  )
}
