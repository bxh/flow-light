/** Web Audio — drone + scroll tick; context starts after a user gesture (browser policy). */
const AUDIO_MASTER = 0.22
const SCROLL_SOUND_MIN_MS = 42

type AudioRig = {
  ctx: AudioContext
  master: GainNode
  humGain: GainNode
  humFilter: BiquadFilterNode
}

let audioRig: AudioRig | null = null
let lastScrollSoundMs = 0
let motionPrevX = 0
let motionPrevY = 0
let motionPrevValid = false

function ensureAudioRig(): AudioRig {
  if (audioRig) return audioRig
  const ctx = new AudioContext()
  const master = ctx.createGain()
  master.gain.value = AUDIO_MASTER
  master.connect(ctx.destination)

  const humFilter = ctx.createBiquadFilter()
  humFilter.type = 'lowpass'
  humFilter.frequency.value = 115
  humFilter.Q.value = 0.85

  const humGain = ctx.createGain()
  humGain.gain.value = 0
  humFilter.connect(humGain)
  humGain.connect(master)

  const low = ctx.createOscillator()
  low.type = 'sawtooth'
  low.frequency.value = 36
  low.connect(humFilter)
  const harmonic = ctx.createOscillator()
  harmonic.type = 'sine'
  harmonic.frequency.value = 72
  harmonic.connect(humFilter)
  low.start()
  harmonic.start()

  audioRig = { ctx, master, humGain, humFilter }
  return audioRig
}

/** Create graph if needed and resume; resolves when context is running or rejects if the browser blocks it. */
export function ensureAudioRunning(): Promise<void> {
  const rig = ensureAudioRig()
  if (rig.ctx.state === 'running') return Promise.resolve()
  return rig.ctx.resume()
}

function updateDroneFromMotion(speed: number) {
  if (!audioRig || audioRig.ctx.state !== 'running') return
  const { ctx, humGain, humFilter } = audioRig
  const t = ctx.currentTime
  const v = Math.min(1, speed * 0.12)
  const targetGain = 0.022 + v * 0.12
  humGain.gain.cancelScheduledValues(t)
  humGain.gain.setValueAtTime(Math.max(0, humGain.gain.value), t)
  humGain.gain.linearRampToValueAtTime(targetGain, t + 0.055)

  const targetFreq = 105 + v * 95
  humFilter.frequency.cancelScheduledValues(t)
  humFilter.frequency.setValueAtTime(Math.max(20, humFilter.frequency.value), t)
  humFilter.frequency.linearRampToValueAtTime(targetFreq, t + 0.07)
}

/** Call once per frame with smoothed pointer position. */
export function tickMotionAudio(smoothX: number, smoothY: number) {
  let speed = 0
  if (motionPrevValid) speed = Math.hypot(smoothX - motionPrevX, smoothY - motionPrevY)
  motionPrevX = smoothX
  motionPrevY = smoothY
  motionPrevValid = true
  updateDroneFromMotion(speed)
}

function playScrollTickNow(deltaY: number) {
  if (!audioRig || audioRig.ctx.state !== 'running') return
  const now = performance.now()
  if (now - lastScrollSoundMs < SCROLL_SOUND_MIN_MS) return
  const mag = Math.min(1, Math.abs(deltaY) / 100)
  if (mag < 0.03) return
  lastScrollSoundMs = now

  const { ctx, master } = audioRig
  const time = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.value = 280 + mag * 220
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, time)
  g.gain.linearRampToValueAtTime(0.045 * mag, time + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0008, time + 0.072)
  osc.connect(g)
  g.connect(master)
  osc.start(time)
  osc.stop(time + 0.085)
}

/** Safe to call from wheel/touch: resumes audio synchronously inside the gesture, then plays. */
export function playScrollTick(deltaY: number) {
  const rig = ensureAudioRig()
  // resume() must be called synchronously inside the user gesture callback
  if (rig.ctx.state === 'suspended') rig.ctx.resume().catch(() => {})
  playScrollTickNow(deltaY)
}

export function initAudioGestureUnlock() {
  const tryResume = () => {
    const rig = ensureAudioRig()
    if (rig.ctx.state === 'suspended') rig.ctx.resume().catch(() => {})
  }
  window.addEventListener('pointerdown', tryResume)
  window.addEventListener('keydown', tryResume)
  window.addEventListener('click', tryResume)
  window.addEventListener('touchstart', tryResume)
}
