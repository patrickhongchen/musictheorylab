import { pitch } from './pitches'
import type { ChordTone, FretboardModel, FretPosition } from './types'

export const STANDARD_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'].map(pitch)

export function createFretboard(tones: readonly ChordTone[], tuning = STANDARD_TUNING, fretCount = 12): FretboardModel {
  const positions: FretPosition[] = []
  tuning.forEach((open, index) => {
    for (let fret = 0; fret <= fretCount; fret++) {
      const tone = tones.find(tone => tone.pitchClass.chroma === (open.midi + fret) % 12)
      if (tone) positions.push({ string: tuning.length - index, fret, tone })
    }
  })
  return { tuning, fretCount, positions }
}
