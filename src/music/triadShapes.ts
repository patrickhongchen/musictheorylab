import { STANDARD_TUNING } from './fretboard'
import type { ChordTone, FretPosition, Inversion, Pitch, IndependentTriad } from './types'
import type { CagedForm, CagedPosition } from './cagedPositions'
import { TRIAD_INVERSIONS, type VoicingLayout } from './voicingPatterns'

/** A complete triad placed from the highest selected string to the lowest. */
export interface TriadShape {
  readonly cagedForm?: CagedForm
  readonly layout?: VoicingLayout
  readonly cagedPosition?: CagedPosition
  readonly colorIndex?: number
  readonly id: string
  readonly triad: IndependentTriad
  readonly notes: readonly FretPosition[]
  readonly inversion: Inversion
}

function selectedAdjacentStrings(strings: readonly number[], tuning: readonly Pitch[]): readonly number[] {
  const selected = [...new Set(strings)].sort((left, right) => left - right)
  if (
    selected.length !== 3
    || selected.some(string => !Number.isInteger(string) || string < 1 || string > tuning.length)
    || selected[1] !== selected[0] + 1
    || selected[2] !== selected[1] + 1
  ) {
    throw new Error('Triad shapes require exactly three adjacent strings')
  }
  return selected
}

function permutations<T>(items: readonly T[]): readonly (readonly T[])[] {
  if (items.length === 0) return [[]]
  return items.flatMap((item, index) => (
    permutations([...items.slice(0, index), ...items.slice(index + 1)]).map(rest => [item, ...rest])
  ))
}

function fretChoices(tone: ChordTone, string: number, tuning: readonly Pitch[], fretCount: number): readonly number[] {
  const open = tuning[tuning.length - string]
  return Array.from({ length: fretCount + 1 }, (_, fret) => fret)
    .filter(fret => (open.midi + fret) % 12 === tone.pitchClass.chroma)
}

/**
 * Enumerates every compact, close-position triad shape on one adjacent string group.
 * Notes are ordered highest string to lowest string; inversion is derived from
 * the actual sounding bass, rather than the role order used to construct it.
 */
export function createTriadShapesOnStrings(
  triad: IndependentTriad,
  strings: readonly number[],
  tuning: readonly Pitch[] = STANDARD_TUNING,
  fretCount = 22,
): readonly TriadShape[] {
  const selectedStrings = selectedAdjacentStrings(strings, tuning)
  if (!Number.isInteger(fretCount) || fretCount < 0) throw new Error('Fret count must be a non-negative integer')
  if (triad.tones.length !== 3 || new Set(triad.tones.map(tone => tone.role)).size !== 3) {
    throw new Error('Triad shapes require one root, third, and fifth')
  }

  const shapes: TriadShape[] = []
  const seen = new Set<string>()
  for (const tones of permutations(triad.tones)) {
    const choices = tones.map((tone, index) => fretChoices(tone, selectedStrings[index], tuning, fretCount))
    for (const highFret of choices[0]) {
      for (const middleFret of choices[1]) {
        for (const lowFret of choices[2]) {
          const frets = [highFret, middleFret, lowFret]
          if (Math.max(...frets) - Math.min(...frets) > 5) continue

          const notes = tones.map((tone, index) => ({ string: selectedStrings[index], fret: frets[index], tone }))
          const soundingMidi = notes.map(note => tuning[tuning.length - note.string].midi + note.fret)
          if (!(soundingMidi[0] > soundingMidi[1] && soundingMidi[1] > soundingMidi[2])) continue

          // A fret-span limit alone also admits spread voicings (for example E2–C3–G3).
          // Keep all three tones within one octave for the three familiar inversion orders.
          if (soundingMidi[0] - soundingMidi[2] >= 12) continue

          const key = notes.map(note => `${note.string}:${note.fret}`).join('|')
          if (seen.has(key)) continue
          seen.add(key)
          const inversion = TRIAD_INVERSIONS[notes[notes.length - 1].tone.role]
          shapes.push({
            id: `${triad.id}:${selectedStrings.join('-')}:${frets.join('-')}`,
            triad,
            notes,
            inversion,
          })
        }
      }
    }
  }

  return shapes.sort((left, right) => (
    left.notes[0].fret - right.notes[0].fret
    || left.notes[1].fret - right.notes[1].fret
    || left.notes[2].fret - right.notes[2].fret
  ))
}

/** Same strings and geometry, translated only by whole octaves. */
export function triadShapeFamilyId(shape: TriadShape): string {
  const octaveOffset = Math.floor(Math.min(...shape.notes.map(note => note.fret)) / 12) * 12
  const layout = shape.layout === 'spread' ? `:spread:${shape.cagedPosition?.form ?? ''}` : ''
  return `${shape.triad.id}${layout}:${shape.notes.map(note => `${note.string}:${note.fret - octaveOffset}`).join('|')}`
}

export function groupTriadShapeRepeats(shapes: readonly TriadShape[]): readonly (readonly TriadShape[])[] {
  const groups = new Map<string, TriadShape[]>()
  for (const shape of shapes) {
    const id = triadShapeFamilyId(shape)
    const group = groups.get(id) ?? []
    group.push(shape)
    groups.set(id, group)
  }
  return [...groups.values()].map(group => group.sort((a, b) => a.notes[0].fret - b.notes[0].fret))
}
