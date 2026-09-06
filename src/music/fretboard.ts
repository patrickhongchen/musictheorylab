import { pitch } from './pitches'
import type {
  ChordTone,
  FretboardModel,
  FretPosition,
  HarmonizedProgression,
  PentatonicScale,
  PentatonicScaleFretboardModel,
  PentatonicScaleFretPosition,
  ProgressionFretboardFrame,
  ProgressionFretboardMarker,
  ProgressionFretboardModel,
  ProgressionFretPosition,
  ProgressionVoicingFretboardModel,
  ProgressionVoicingShape,
  Scale,
  ScaleFretboardModel,
  ScaleFretPosition,
  VoicingFretPosition,
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

/** Maps every occurrence of every pentatonic scale tone across the requested fret range. */
export function createPentatonicScaleFretboard(
  scale: PentatonicScale,
  tuning = STANDARD_TUNING,
  fretCount = 15,
): PentatonicScaleFretboardModel {
  const positions: PentatonicScaleFretPosition[] = []

  tuning.forEach((open, index) => {
    for (let fret = 0; fret <= fretCount; fret++) {
      const tone = scale.tones.find(candidate => candidate.pitchClass.chroma === (open.midi + fret) % 12)
      if (tone) positions.push({ string: tuning.length - index, fret, tone })
    }
  })

  positions.sort((left, right) => left.string - right.string || left.fret - right.fret)
  return { tuning, fretCount, positions }
}

interface ShapeCandidate {
  readonly notes: readonly VoicingFretPosition[]
  readonly soundingMidi: readonly number[]
}

function combinations<T>(choices: readonly (readonly T[])[]): readonly (readonly T[])[] {
  return choices.reduce<readonly (readonly T[])[]>((groups, options) => (
    groups.flatMap(group => options.map(option => [...group, option]))
  ), [[]])
}

function candidateShapes(
  progression: HarmonizedProgression,
  stepIndex: number,
  strings: readonly number[],
  tuning: readonly ReturnType<typeof pitch>[],
  fretCount: number,
): readonly ShapeCandidate[] {
  const step = progression.steps[stepIndex]
  const highToLowVoices = [...step.voicing.notes].reverse()
  const fretChoices = highToLowVoices.map((voice, index) => {
    const string = strings[index]
    const open = tuning[tuning.length - string]
    return Array.from({ length: fretCount + 1 }, (_, fret) => fret)
      .filter(fret => (open.midi + fret) % 12 === voice.pitch.chroma)
  })

  if (fretChoices.some(options => options.length === 0)) {
    throw new Error(`Cannot place progression step ${stepIndex + 1} on strings ${strings.join(', ')}`)
  }

  const all = combinations(fretChoices).map(frets => {
    const notes = frets.map((fret, index): VoicingFretPosition => {
      const voice = highToLowVoices[index]
      const degreeIndex = progression.scale.notes.findIndex(note => note.chroma === voice.pitch.chroma)
      return {
        string: strings[index],
        fret,
        degree: (degreeIndex + 1) as VoicingFretPosition['degree'],
        tone: voice,
        isTopNote: index === 0,
      }
    })
    return {
      notes,
      soundingMidi: notes.map(note => tuning[tuning.length - note.string].midi + note.fret),
    }
  })

  const voiceOrdered = all.filter(candidate => candidate.soundingMidi.every((midi, index, pitches) => (
    index === 0 || pitches[index - 1] > midi
  )))
  const compact = voiceOrdered.filter(candidate => {
    const frets = candidate.notes.map(note => note.fret)
    return Math.max(...frets) - Math.min(...frets) <= 5
  })
  return compact.length > 0 ? compact : voiceOrdered.length > 0 ? voiceOrdered : all
}

function shapeCost(shape: ShapeCandidate) {
  const frets = shape.notes.map(note => note.fret)
  const registerDistance = shape.soundingMidi.reduce((total, midi, index) => (
    total + Math.abs(midi - shape.notes[index].tone.pitch.midi)
  ), 0)
  return (Math.max(...frets) - Math.min(...frets)) * 4 + registerDistance * 3
}

function transitionCost(from: ShapeCandidate, to: ShapeCandidate) {
  return to.notes.reduce((total, note, index) => total + Math.abs(note.fret - from.notes[index].fret), 0)
}

/**
 * Places one complete selected inversion per progression step on three ordered
 * strings. Dynamic programming favors the staff's register, compact shapes,
 * and economical movement rather than returning every matching chord tone.
 */
export function createProgressionVoicingFretboard(
  progression: HarmonizedProgression,
  strings: readonly number[],
  tuning = STANDARD_TUNING,
  fretCount = 15,
  repeatAcrossNeck = false,
): ProgressionVoicingFretboardModel {
  const selectedStrings = [...new Set(strings)]
    .filter(string => Number.isInteger(string) && string >= 1 && string <= tuning.length)
    .sort((left, right) => left - right)
  if (selectedStrings.length !== 3) throw new Error('Progression voicing shapes require exactly three strings')

  const candidates = progression.steps.map(step => candidateShapes(
    progression,
    step.index,
    selectedStrings,
    tuning,
    fretCount,
  ))
  const layers: { cost: number; previous: number }[][] = []

  candidates.forEach((stepCandidates, stepIndex) => {
    layers.push(stepCandidates.map(candidate => {
      if (stepIndex === 0) return { cost: shapeCost(candidate), previous: -1 }
      const prior = candidates[stepIndex - 1]
      const choices = prior.map((previous, previousIndex) => ({
        cost: layers[stepIndex - 1][previousIndex].cost + transitionCost(previous, candidate) + shapeCost(candidate),
        previous: previousIndex,
      }))
      return choices.reduce((best, choice) => choice.cost < best.cost ? choice : best, choices[0])
    }))
  })

  const lastLayer = layers[layers.length - 1]
  let candidateIndex = lastLayer.reduce((best, state, index, states) => state.cost < states[best].cost ? index : best, 0)
  const selected: ProgressionVoicingShape[] = Array(progression.steps.length)
  for (let stepIndex = progression.steps.length - 1; stepIndex >= 0; stepIndex--) {
    selected[stepIndex] = { stepIndex, fretOffset: 0, notes: candidates[stepIndex][candidateIndex].notes }
    candidateIndex = layers[stepIndex][candidateIndex].previous
  }

  const shapes = repeatAcrossNeck
    ? selected.flatMap(shape => {
        const repeats: ProgressionVoicingShape[] = []
        const octaveRange = Math.ceil(fretCount / 12)
        for (let octave = -octaveRange; octave <= octaveRange; octave++) {
          const fretOffset = octave * 12
          const notes = shape.notes.map(note => ({ ...note, fret: note.fret + fretOffset }))
          if (notes.every(note => note.fret >= 0 && note.fret <= fretCount)) {
            repeats.push({ stepIndex: shape.stepIndex, fretOffset, notes })
          }
        }
        return repeats
      }).sort((left, right) => left.notes[0].fret - right.notes[0].fret || left.stepIndex - right.stepIndex)
    : selected

  return { tuning, fretCount, strings: selectedStrings, shapes }
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
