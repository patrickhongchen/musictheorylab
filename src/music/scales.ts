import { Note } from 'tonal'
import { SCALE_CATALOG, createScaleTones, type ScaleType } from './scaleCatalog'
import { pitchClass } from './pitches'
import type {
  ExplorerScale,
  Key,
  PentatonicScale,
  PentatonicScaleType,
  Scale,
  ScaleExplorerScaleType,
} from './types'

/** All 15 conventional major key signatures, from seven flats to seven sharps. */
export const MAJOR_KEYS: readonly Key[] = Array.from({ length: 15 }, (_, index) => ({
  tonic: Note.transposeFifths('C', index - 7), mode: 'major' as const,
}))

export function createScale(key: Key): Scale {
  const scale = createScaleTones(key.tonic, SCALE_CATALOG.ionian)
  return { key, name: scale.name, notes: scale.tones.map(tone => tone.pitchClass) }
}

export const SCALE_EXPLORER_SCALE_TYPES = [
  'majorPentatonic', 'minorPentatonic', 'ionian', 'aeolian',
] as const satisfies readonly ScaleType[]

export const SCALE_EXPLORER_SCALE_LABELS: Readonly<Record<ScaleExplorerScaleType, string>> = {
  majorPentatonic: 'Major pentatonic',
  minorPentatonic: 'Minor pentatonic',
  ionian: 'Major / Ionian',
  aeolian: 'Natural minor / Aeolian',
}

// CAGED anchor selection is specific to Scale Explorer.
const EXPLORER_TONIC_CHORD_QUALITIES = {
  majorPentatonic: 'major', minorPentatonic: 'minor', ionian: 'major', aeolian: 'minor',
} as const satisfies Record<ScaleExplorerScaleType, ExplorerScale['tonicChordQuality']>

/** Creates any scale offered by Scale Explorer while retaining Tonal's spelling. */
export function createExplorerScale(tonic: string, type: ScaleExplorerScaleType): ExplorerScale {
  if (!SCALE_EXPLORER_SCALE_TYPES.includes(type)) throw new Error(`Unsupported Scale Explorer scale type: ${type}`)
  const scale = createScaleTones(tonic, SCALE_CATALOG[type])
  return {
    ...scale,
    tonic: pitchClass(tonic).name,
    type,
    displayName: SCALE_EXPLORER_SCALE_LABELS[type],
    tonicChordQuality: EXPLORER_TONIC_CHORD_QUALITIES[type],
  }
}

/** Pentatonic feature model retains its major/minor IDs and narrower labels. */
export function createPentatonicScale(tonic: string, type: PentatonicScaleType): PentatonicScale {
  const scale = createScaleTones(tonic, SCALE_CATALOG[type === 'major' ? 'majorPentatonic' : 'minorPentatonic'])
  return { ...scale, tonic: pitchClass(tonic).name, type }
}
