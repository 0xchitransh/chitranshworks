import { useStage } from '../store/useStage'

/**
 * Procedural audio: no sound files, so nothing can 404. It is created lazily on
 * the first explicit "sound on" click, which also satisfies autoplay policies.
 */
let ctx: AudioContext | null = null
let master: GainNode | null = null
let room: GainNode | null = null
let crowd: GainNode | null = null
let thockTimer: number | undefined
let running = false

function noiseBuffer(audio: AudioContext, seconds: number, brown = false): AudioBuffer {
  const buffer = audio.createBuffer(1, audio.sampleRate * seconds, audio.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    if (brown) {
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    } else {
      data[i] = white
    }
  }
  return buffer
}

function loopNoise(audio: AudioContext, brown: boolean): AudioBufferSourceNode {
  const src = audio.createBufferSource()
  src.buffer = noiseBuffer(audio, 4, brown)
  src.loop = true
  return src
}

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)

    // Dressing-room tone: low brown noise
    room = ctx.createGain()
    room.gain.value = 0.5
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 320
    const roomSrc = loopNoise(ctx, true)
    roomSrc.connect(lp).connect(room).connect(master)
    roomSrc.start()

    // Distant stadium crowd: band-limited noise with slow swell
    crowd = ctx.createGain()
    crowd.gain.value = 0.12
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 700
    bp.Q.value = 0.6
    const crowdSrc = loopNoise(ctx, false)
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.value = 0.09
    lfoGain.gain.value = 0.05
    lfo.connect(lfoGain).connect(crowd.gain)
    lfo.start()
    crowdSrc.connect(bp).connect(crowd).connect(master)
    crowdSrc.start()
  }
  return ctx
}

function scheduleThock() {
  window.clearTimeout(thockTimer)
  thockTimer = window.setTimeout(
    () => {
      if (running) {
        sfx.thock()
        scheduleThock()
      }
    },
    12000 + Math.random() * 14000,
  )
}

function burst(opts: { freq: number; q?: number; dur: number; gain: number; type?: BiquadFilterType; sweepTo?: number }) {
  const audio = ctx
  if (!audio || !master || !running) return
  const src = audio.createBufferSource()
  src.buffer = noiseBuffer(audio, Math.max(0.2, opts.dur + 0.1))
  const f = audio.createBiquadFilter()
  f.type = opts.type ?? 'bandpass'
  f.frequency.value = opts.freq
  f.Q.value = opts.q ?? 1
  if (opts.sweepTo) f.frequency.exponentialRampToValueAtTime(opts.sweepTo, audio.currentTime + opts.dur)
  const g = audio.createGain()
  g.gain.setValueAtTime(0.0001, audio.currentTime)
  g.gain.exponentialRampToValueAtTime(opts.gain, audio.currentTime + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + opts.dur)
  src.connect(f).connect(g).connect(master)
  src.start()
  src.stop(audio.currentTime + opts.dur + 0.05)
}

let lastScrub = 0

export const sfx = {
  whoosh() {
    burst({ freq: 500, q: 0.8, dur: 0.7, gain: 0.05, sweepTo: 1800 })
  },
  scrub() {
    const now = performance.now()
    if (now - lastScrub < 90) return
    lastScrub = now
    burst({ freq: 2400, q: 0.7, dur: 0.18, gain: 0.025 })
  },
  thock() {
    const audio = ctx
    if (!audio || !master || !running) return
    const osc = audio.createOscillator()
    const g = audio.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(190, audio.currentTime)
    osc.frequency.exponentialRampToValueAtTime(70, audio.currentTime + 0.12)
    g.gain.setValueAtTime(0.06, audio.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.18)
    osc.connect(g).connect(master)
    osc.start()
    osc.stop(audio.currentTime + 0.2)
  },
  chime() {
    const audio = ctx
    if (!audio || !master || !running) return
    ;[523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = audio.createOscillator()
      const g = audio.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t0 = audio.currentTime + i * 0.09
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(0.035, t0 + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2)
      osc.connect(g).connect(master as GainNode)
      osc.start(t0)
      osc.stop(t0 + 1.3)
    })
  },
}

export async function setSoundEnabled(on: boolean): Promise<void> {
  if (on) {
    const audio = ensure()
    if (!audio || !master) {
      useStage.getState().setSoundOn(false)
      return
    }
    try {
      await audio.resume()
    } catch {
      useStage.getState().setSoundOn(false)
      return
    }
    running = true
    master.gain.cancelScheduledValues(audio.currentTime)
    master.gain.linearRampToValueAtTime(0.9, audio.currentTime + 1.2)
    scheduleThock()
  } else if (ctx && master) {
    running = false
    window.clearTimeout(thockTimer)
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4)
    window.setTimeout(() => {
      if (!running) void ctx?.suspend()
    }, 500)
  }
}

/** Crowd rises when the visitor looks out at the stadium. */
export function setStadiumLevel(level: number): void {
  if (!ctx || !crowd || !room) return
  crowd.gain.setTargetAtTime(0.12 + level * 0.3, ctx.currentTime, 0.6)
  room.gain.setTargetAtTime(0.5 - level * 0.25, ctx.currentTime, 0.6)
}
