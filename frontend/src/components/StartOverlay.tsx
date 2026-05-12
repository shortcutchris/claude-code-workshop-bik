type Props = {
  phase: 'idle' | 'paused'
}

export function StartOverlay({ phase }: Props) {
  const text = phase === 'idle' ? 'Press SPACE to start' : 'Paused — SPACE to resume'
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="px-6 py-3 rounded-md bg-slate-950/80 border border-cyan-500/40 text-cyan-300 text-xl font-mono tracking-wider">
        {text}
      </div>
    </div>
  )
}
