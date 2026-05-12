let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}

export function playEat(): void {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, c.currentTime)
    gain.gain.setValueAtTime(0.2, c.currentTime)
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.06)
    osc.connect(gain).connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + 0.06)
  } catch {
    // audio is best-effort; ignore failures
  }
}

export function playGameOver(): void {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(400, c.currentTime)
    osc.frequency.linearRampToValueAtTime(100, c.currentTime + 0.3)
    gain.gain.setValueAtTime(0.3, c.currentTime)
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.3)
    osc.connect(gain).connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + 0.3)
  } catch {
    // ignore
  }
}
