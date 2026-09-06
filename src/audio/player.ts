import * as Tone from 'tone'
import type { Voicing } from '../music/types'

export type PlaybackMode = 'chord' | 'arpeggio'

/** Owns audio resources; accepts the very same pitches used by the staff. */
export class VoicingPlayer {
  private synth?: Tone.PolySynth
  private disposed = false

  async play(voicing: Voicing, mode: PlaybackMode): Promise<number> {
    // Called directly from the click handler, before any await or resource creation.
    await Tone.start()
    if (this.disposed) return 0
    this.synth?.dispose()
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.018, decay: 0.35, sustain: 0.22, release: 0.8 },
      volume: -15,
    }).toDestination()
    const now = Tone.now() + 0.03
    // Frequencies preserve B#/Cb acoustic octaves without another spelling parser.
    const frequencies = voicing.notes.map(note => note.pitch.frequency)
    if (mode === 'chord') this.synth.triggerAttackRelease(frequencies, 1.1, now, 0.65)
    else frequencies.forEach((frequency, index) => this.synth!.triggerAttackRelease(frequency, 0.55, now + index * 0.34, 0.65))
    return mode === 'chord' ? 1930 : 2060
  }

  dispose() { this.disposed = true; this.synth?.dispose(); this.synth = undefined }
}
