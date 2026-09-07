import * as Tone from 'tone'
import type { BluesChord, TwelveBarBlues } from '../music/blues'

function chordFrequencies(chord: BluesChord) {
  return chord.tones.map((tone, index) => Tone.Frequency(`${tone.pitchClass.name}${index === 0 ? 2 : 3}`).toFrequency())
}

/** Schedules one chorus while UI timers keep the visible bar aligned to the audio clock. */
export class BluesPlayer {
  private synth?: Tone.PolySynth
  private timers: number[] = []
  private disposed = false

  async play(
    progression: TwelveBarBlues,
    bpm: number,
    onBar: (barIndex: number) => void,
    onEnd: () => void,
  ) {
    await Tone.start()
    if (this.disposed) return
    this.stop()
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.012, decay: 0.32, sustain: 0.16, release: 0.75 },
      volume: -18,
    }).toDestination()

    const barSeconds = 240 / bpm
    const start = Tone.now() + 0.08
    progression.bars.forEach((bar, index) => {
      this.synth!.triggerAttackRelease(chordFrequencies(bar.chord), Math.min(1.35, barSeconds * 0.55), start + index * barSeconds, 0.55)
      this.timers.push(window.setTimeout(() => onBar(index), 80 + index * barSeconds * 1000))
    })
    this.timers.push(window.setTimeout(onEnd, 80 + progression.bars.length * barSeconds * 1000))
  }

  stop() {
    this.timers.forEach(timer => window.clearTimeout(timer))
    this.timers = []
    this.synth?.releaseAll(Tone.now())
    this.synth?.dispose()
    this.synth = undefined
  }

  dispose() {
    this.stop()
    this.disposed = true
  }
}
