import { pitch } from './pitches'
import type {
  ChordTone,
  FretboardModel,
  FretPosition,
  HarmonizedProgression,
  ProgressionFretboardFrame,
  ProgressionFretboardMarker,
  ProgressionFretboardModel,
  ProgressionFretPosition,
  Scale,
  ScaleFretboardModel,
  ScaleFretPosition,
} from './types'

export const STANDARD_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'].map(pitch)

export function createFretboard(tones: readonly ChordTone[], tuning = STANDARD_TUNING, fretCount = 15): FretboardModel {
  const positions: FretPosition[] = []
  tuning.forEach((open, index) => {
    for (let fret = 0; fret <= fretCount; fret++) {
      const tone = tones.find(tone => tone.pitchClass.chroma === (open.midi + fret) % 12)
      if (tone) positions.push({ string: tuning.length - index, fret, tone })
    }
  })
  return { tuning, fretCount, positions }
}

/** Maps every diatonic pitch-class occurrence, independent of selection and presentation state. */
export function createScaleFretboard(scale: Scale, tuning = STANDARD_TUNING, fretCount = 15): ScaleFretboardModel {
  const positions: ScaleFretPosition[] = []

  tuning.forEach((open, index) => {
    for (let fret = 0; fret <= fretCount; fret++) {
      const noteIndex = scale.notes.findIndex(note => note.chroma === (open.midi + fret) % 12)
      if (noteIndex >= 0) {
        positions.push({
          string: tuning.length - index,
          fret,
          degree: (noteIndex + 1) as ScaleFretPosition['degree'],
          pitchClass: scale.notes[noteIndex],
        })
      }
    }
  })

  positions.sort((left, right) => left.string - right.string || left.fret - right.fret)
  return { tuning, fretCount, positions }
}

/** Keeps each chord in its own frame so shared pitches retain their role per step. */
export function createProgressionFretboards(progression: HarmonizedProgression, tuning = STANDARD_TUNING, fretCount = 15): readonly ProgressionFretboardFrame[] {
  return progression.steps.map(step => ({
    stepIndex: step.index,
    topDegree: step.topDegree,
    triad: step.triad,
    model: createFretboard(step.triad.tones, tuning, fretCount),
  }))
}

/** Groups every progression occurrence by physical string/fret without losing step-specific roles or spelling. */
export function createProgressionFretboard(progression: HarmonizedProgression, tuning = STANDARD_TUNING, fretCount = 15): ProgressionFretboardModel {
  const grouped = new Map<string, { string: number; fret: number; markers: ProgressionFretboardMarker[] }>()

  progression.steps.forEach(step => {
    createFretboard(step.triad.tones, tuning, fretCount).positions.forEach(({ string, fret, tone }) => {
      const key = `${string}-${fret}`
      const position = grouped.get(key) ?? { string, fret, markers: [] }
      position.markers.push({ stepIndex: step.index, topDegree: step.topDegree, triad: step.triad, tone })
      grouped.set(key, position)
    })
  })

  const positions: ProgressionFretPosition[] = [...grouped.values()]
    .sort((left, right) => left.string - right.string || left.fret - right.fret)
    .map(position => ({
      ...position,
      markers: position.markers.sort((left, right) => left.stepIndex - right.stepIndex),
    }))

  return { tuning, fretCount, positions }
}
