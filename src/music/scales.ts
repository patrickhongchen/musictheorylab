import { Note, Scale as TonalScale } from 'tonal'
import { pitchClass } from './pitches'
import type { Key, PentatonicScale, PentatonicScaleToneLabel, PentatonicScaleType, Scale } from './types'

/** All 15 conventional major key signatures, from seven flats to seven sharps. */
export const MAJOR_KEYS: readonly Key[] = Array.from({ length: 15 }, (_, index) => ({
  tonic: Note.transposeFifths('C', index - 7), mode: 'major' as const,
}))

export function createScale(key: Key): Scale {
  const data = TonalScale.get(`${key.tonic} ${key.mode}`)
  if (data.empty || data.notes.length !== 7) throw new Error(`Unsupported key: ${key.tonic} ${key.mode}`)
  return { key, name: data.name, notes: data.notes.map(pitchClass) }
}

const PENTATONIC_LABELS: Record<PentatonicScaleType, readonly PentatonicScaleToneLabel[]> = {
  major: ['1', '2', '3', '5', '6'],
  minor: ['1', 'b3', '4', '5', 'b7'],
}

/** Creates an interval-aware pentatonic scale while preserving Tonal's enharmonic spelling. */
export function createPentatonicScale(tonic: string, type: PentatonicScaleType): PentatonicScale {
  const data = TonalScale.get(`${tonic} ${type} pentatonic`)
  if (data.empty || data.notes.length !== 5 || data.intervals.length !== 5) {
    throw new Error(`Unsupported scale: ${tonic} ${type} pentatonic`)
  }

  return {
    tonic,
    type,
    name: data.name,
    tones: data.notes.map((note, index) => ({
      pitchClass: pitchClass(note),
      interval: data.intervals[index],
      label: PENTATONIC_LABELS[type][index],
    })),
  }
}
