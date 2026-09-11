import { Note, Scale as TonalScale } from 'tonal'
import { pitchClass } from './pitches'
import type {
  ExplorerScale,
  Key,
  PentatonicScale,
  PentatonicScaleToneLabel,
  PentatonicScaleType,
  Scale,
  ScaleExplorerScaleType,
  ScaleToneLabel,
} from './types'

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

export const SCALE_EXPLORER_SCALE_TYPES = [
  'majorPentatonic', 'minorPentatonic', 'ionian', 'aeolian',
] as const satisfies readonly ScaleExplorerScaleType[]

export const SCALE_EXPLORER_SCALE_LABELS: Readonly<Record<ScaleExplorerScaleType, string>> = {
  majorPentatonic: 'Major pentatonic',
  minorPentatonic: 'Minor pentatonic',
  ionian: 'Major / Ionian',
  aeolian: 'Natural minor / Aeolian',
}

interface ExplorerScaleDefinition {
  readonly tonalName: string
  readonly labels: readonly ScaleToneLabel[]
  readonly tonicChordQuality: ExplorerScale['tonicChordQuality']
}

const EXPLORER_SCALE_DEFINITIONS: Readonly<Record<ScaleExplorerScaleType, ExplorerScaleDefinition>> = {
  majorPentatonic: {
    tonalName: 'major pentatonic', labels: ['1', '2', '3', '5', '6'], tonicChordQuality: 'major',
  },
  minorPentatonic: {
    tonalName: 'minor pentatonic', labels: ['1', 'b3', '4', '5', 'b7'], tonicChordQuality: 'minor',
  },
  ionian: {
    tonalName: 'ionian', labels: ['1', '2', '3', '4', '5', '6', '7'], tonicChordQuality: 'major',
  },
  aeolian: {
    tonalName: 'aeolian', labels: ['1', '2', 'b3', '4', '5', 'b6', 'b7'], tonicChordQuality: 'minor',
  },
}

/** Creates any scale offered by Scale Explorer while retaining Tonal's spelling. */
export function createExplorerScale(tonic: string, type: ScaleExplorerScaleType): ExplorerScale {
  const definition = EXPLORER_SCALE_DEFINITIONS[type]
  if (!definition) throw new Error(`Unsupported Scale Explorer scale type: ${type}`)
  const data = TonalScale.get(`${tonic} ${definition.tonalName}`)
  if (data.empty || data.notes.length !== definition.labels.length || data.intervals.length !== definition.labels.length) {
    throw new Error(`Unsupported scale: ${tonic} ${definition.tonalName}`)
  }

  return {
    tonic: pitchClass(tonic).name,
    type,
    name: data.name,
    displayName: SCALE_EXPLORER_SCALE_LABELS[type],
    tonicChordQuality: definition.tonicChordQuality,
    tones: data.notes.map((note, index) => ({
      pitchClass: pitchClass(note),
      interval: data.intervals[index],
      label: definition.labels[index],
    })),
  }
}

/** Creates an interval-aware pentatonic scale while preserving Tonal's enharmonic spelling. */
export function createPentatonicScale(tonic: string, type: PentatonicScaleType): PentatonicScale {
  const scale = createExplorerScale(tonic, type === 'major' ? 'majorPentatonic' : 'minorPentatonic')
  return {
    tonic: scale.tonic,
    type,
    name: scale.name,
    tones: scale.tones.map((tone, index) => ({
      ...tone,
      label: PENTATONIC_LABELS[type][index],
    })),
  }
}
