import { Scale as TonalScale } from 'tonal'
import { pitchClass } from './pitches'

/** Universal scale families. Feature menus and copy live with their consumers. */
export const SCALE_CATALOG = {
  ionian: { tonalName: 'ionian', labels: ['1', '2', '3', '4', '5', '6', '7'] },
  dorian: { tonalName: 'dorian', labels: ['1', '2', 'b3', '4', '5', '6', 'b7'] },
  mixolydian: { tonalName: 'mixolydian', labels: ['1', '2', '3', '4', '5', '6', 'b7'] },
  aeolian: { tonalName: 'aeolian', labels: ['1', '2', 'b3', '4', '5', 'b6', 'b7'] },
  majorPentatonic: { tonalName: 'major pentatonic', labels: ['1', '2', '3', '5', '6'] },
  minorPentatonic: { tonalName: 'minor pentatonic', labels: ['1', 'b3', '4', '5', 'b7'] },
  blues: { tonalName: 'blues', labels: ['1', 'b3', '4', 'b5', '5', 'b7'] },
} as const

export type ScaleType = keyof typeof SCALE_CATALOG
export type ScaleLabel<Type extends ScaleType = ScaleType> = typeof SCALE_CATALOG[Type]['labels'][number]

/** Tonal spelling is preserved; consumers may simplify it for the fretboard. */
export function createScaleTones<Label extends string>(
  tonic: string,
  definition: { readonly tonalName: string; readonly labels: readonly Label[] },
) {
  const data = TonalScale.get(`${tonic} ${definition.tonalName}`)
  if (data.empty || data.notes.length !== definition.labels.length || data.intervals.length !== definition.labels.length) {
    throw new Error(`Unsupported scale: ${tonic} ${definition.tonalName}`)
  }
  return {
    name: data.name,
    tones: data.notes.map((note, index) => ({
      pitchClass: pitchClass(note),
      interval: data.intervals[index],
      label: definition.labels[index],
    })),
  }
}
