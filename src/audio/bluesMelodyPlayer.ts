import * as Tone from 'tone'
import type { Pitch } from '../music/types'

/** Small monophonic player for the exact pitches displayed by the blues staff. */
export class BluesMelodyPlayer {
  private synth?: Tone.Synth
  private disposed = false

  async play(pitches: readonly Pitch[], intervalSeconds: number) {
    await Tone.start()
    if (this.disposed) return 0
    this.synth?.dispose()
    this.synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.012, decay: 0.18, sustain: 0.24, release: 0.45 },
      volume: -13,
    }).toDestination()
    const now = Tone.now() + 0.03
    pitches.forEach((pitch, index) => this.synth!.triggerAttackRelease(
      pitch.frequency,
      index === pitches.length - 1 ? 0.85 : Math.max(0.2, intervalSeconds * 0.72),
      now + index * intervalSeconds,
      0.68,
    ))
    return Math.ceil((pitches.length - 1) * intervalSeconds * 1000 + 1050)
  }

  stop() {
    this.synth?.triggerRelease(Tone.now())
    this.synth?.dispose()
    this.synth = undefined
  }

  dispose() {
    this.stop()
    this.disposed = true
  }
}
