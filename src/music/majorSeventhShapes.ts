import { majorSeventhCagedRegions } from './majorSeventhCaged'
import { Note } from 'tonal'
import type { CagedForm } from './cagedPositions'
import {
  soundingBass,
  type ChordShapeInversion,
  type MajorSeventhChord,
  type PlayableChordShape,
  type PlayableChordToneRole,
} from './chordShapes'
import { STANDARD_TUNING } from './fretboard'
import { pitchClass } from './pitches'

export const SEVENTH_INVERSIONS: Readonly<Record<PlayableChordToneRole, ChordShapeInversion>> = {
  root: { index: 0, name: 'Root position', figure: '7' },
  third: { index: 1, name: 'First inversion', figure: '6/5' },
  fifth: { index: 2, name: 'Second inversion', figure: '4/3' },
  seventh: { index: 3, name: 'Third inversion', figure: '4/2' },
}

interface TemplateNote {
  readonly string: number
  readonly fretOffset: number
  readonly role: PlayableChordToneRole
}

export interface MajorSeventhShapeTemplate {
  readonly id: string
  readonly name: string
  readonly rootString: number
  readonly notes: readonly TemplateNote[]
  readonly mutedStrings: readonly number[]
  readonly layout: 'drop2' | 'curated'
  readonly cagedForm?: CagedForm
}

const note = (string: number, fretOffset: number, role: PlayableChordToneRole): TemplateNote => (
  { string, fretOffset, role }
)

/**
 * Movable, complete four-note grips. The root fret is the zero point, so the
 * geometry is independent of key. The requested GuitarLand frame reference
 * routes to the site's diagram tool; its accompanying lesson documents the
 * R-5-7-3 and R-7-3-5 orders as Major 7 Voicings I and II:
 * https://www.guitarland.com/ChordDiagrams/Frame3.html
 * https://www.guitarland.com/Music10/FGA/Lecture7thChords.html#ma7voicings
 */
export const MAJOR_SEVENTH_SHAPE_TEMPLATES: readonly MajorSeventhShapeTemplate[] = [
  {
    id: 'drop2-top4-root', name: 'Top-four drop 2 · root position', rootString: 4,
    notes: [note(1, 2, 'third'), note(2, 2, 'seventh'), note(3, 2, 'fifth'), note(4, 0, 'root')],
    mutedStrings: [5, 6], layout: 'drop2', cagedForm: 'D',
  },
  {
    id: 'drop2-top4-first', name: 'Top-four drop 2 · first inversion', rootString: 2,
    notes: [note(1, 2, 'fifth'), note(2, 0, 'root'), note(3, 3, 'seventh'), note(4, 1, 'third')],
    mutedStrings: [5, 6], layout: 'drop2',
  },
  {
    id: 'drop2-top4-second', name: 'Top-four drop 2 · second inversion', rootString: 3,
    notes: [note(1, 2, 'seventh'), note(2, 0, 'third'), note(3, 0, 'root'), note(4, 0, 'fifth')],
    mutedStrings: [5, 6], layout: 'drop2',
  },
  {
    id: 'drop2-top4-third', name: 'Top-four drop 2 · third inversion', rootString: 1,
    notes: [note(1, 0, 'root'), note(2, 0, 'fifth'), note(3, 1, 'third'), note(4, 1, 'seventh')],
    mutedStrings: [5, 6], layout: 'drop2',
  },
  {
    id: 'a-root-r573', name: 'A-string root · R-5-7-3', rootString: 5,
    notes: [note(2, 2, 'third'), note(3, 1, 'seventh'), note(4, 2, 'fifth'), note(5, 0, 'root')],
    mutedStrings: [1, 6], layout: 'curated', cagedForm: 'A',
  },
  {
    id: 'e-root-r735', name: 'E-string root · R-7-3-5', rootString: 6,
    notes: [note(2, 0, 'fifth'), note(3, 1, 'third'), note(4, 1, 'seventh'), note(6, 0, 'root')],
    mutedStrings: [1, 5], layout: 'curated', cagedForm: 'E',
  },
  {
    id: 'a-first-37r5', name: 'A-string bass · first inversion', rootString: 3,
    notes: [note(2, 3, 'fifth'), note(3, 0, 'root'), note(4, 4, 'seventh'), note(5, 2, 'third')],
    mutedStrings: [1, 6], layout: 'drop2',
  },
  {
    id: 'a-second-5r37', name: 'A-string bass · second inversion', rootString: 4,
    notes: [note(2, 2, 'seventh'), note(3, -1, 'third'), note(4, 0, 'root'), note(5, 0, 'fifth')],
    mutedStrings: [1, 6], layout: 'drop2',
  },
  {
    id: 'a-third-735r', name: 'A-string bass · third inversion', rootString: 2,
    notes: [note(2, 0, 'root'), note(3, -1, 'fifth'), note(4, 1, 'third'), note(5, 1, 'seventh')],
    mutedStrings: [1, 6], layout: 'drop2',
  },
  {
    id: 'e-first-3r57', name: 'E-string bass · first inversion', rootString: 4,
    notes: [note(2, 2, 'seventh'), note(3, 2, 'fifth'), note(4, 0, 'root'), note(6, 2, 'third')],
    mutedStrings: [1, 5], layout: 'curated',
  },
  {
    id: 'e-second-537r', name: 'E-string bass · second inversion', rootString: 2,
    notes: [note(2, 0, 'root'), note(3, 3, 'seventh'), note(4, 1, 'third'), note(6, 2, 'fifth')],
    mutedStrings: [1, 5], layout: 'curated',
  },
  {
    id: 'e-third-75r3', name: 'E-string bass · third inversion', rootString: 3,
    notes: [note(2, 0, 'third'), note(3, 0, 'root'), note(4, 0, 'fifth'), note(6, 2, 'seventh')],
    mutedStrings: [1, 5], layout: 'curated',
  },
] as const

export function createMajorSeventh(rootName: string): MajorSeventhChord {
  const root = pitchClass(rootName)
  const definitions = [
    ['root', '1P'], ['third', '3M'], ['fifth', '5P'], ['seventh', '7M'],
  ] as const
  return {
    id: `${root.name}:major7`, root, quality: 'major7', chordName: `${root.name} major 7`,
    tones: definitions.map(([role, interval]) => ({
      role, interval, pitchClass: pitchClass(Note.transpose(root.name, interval)),
    })),
  }
}

function firstRootFret(chord: MajorSeventhChord, template: MajorSeventhShapeTemplate): number {
  const open = STANDARD_TUNING[STANDARD_TUNING.length - template.rootString]
  return (chord.root.chroma - open.chroma + 12) % 12
}

export function createMajorSeventhShapes(
  chord: MajorSeventhChord,
  { fretCount = 22 }: { readonly fretCount?: number } = {},
): readonly PlayableChordShape[] {
  if (!Number.isInteger(fretCount) || fretCount < 0) throw new Error('Fret count must be a non-negative integer')
  if (chord.quality !== 'major7' || chord.tones.length !== 4) throw new Error('Major 7 shapes require a complete Major 7 chord')

  const unique = new Map<string, PlayableChordShape>()
  for (const template of MAJOR_SEVENTH_SHAPE_TEMPLATES) {
    for (let rootFret = firstRootFret(chord, template); rootFret <= fretCount; rootFret += 12) {
      const notes = template.notes.map(coordinate => ({
        string: coordinate.string,
        fret: rootFret + coordinate.fretOffset,
        tone: chord.tones.find(tone => tone.role === coordinate.role)!,
      }))
      if (notes.some(position => position.fret < 0 || position.fret > fretCount)) continue
      if (new Set(notes.map(position => position.tone.role)).size !== 4) continue
      if (notes.some(position => (
        (STANDARD_TUNING[STANDARD_TUNING.length - position.string].midi + position.fret) % 12
        !== position.tone.pitchClass.chroma
      ))) throw new Error(`Invalid Major 7 geometry: ${template.id}`)

      const shapeBase = {
        id: `${chord.id}:${template.id}:${rootFret}`,
        chord, notes, compatibleCagedRegions: majorSeventhCagedRegions(chord, notes, fretCount), cagedForm: template.cagedForm, layout: template.layout,
        templateId: template.id, templateName: template.name,
        rootAnchor: { string: template.rootString, fret: rootFret },
        mutedStrings: template.mutedStrings,
      } as const
      const bass = soundingBass({ ...shapeBase, inversion: SEVENTH_INVERSIONS.root })
      const shape: PlayableChordShape = { ...shapeBase, inversion: SEVENTH_INVERSIONS[bass.tone.role] }
      const physicalKey = notes.map(position => `${position.string}:${position.fret}`).join('|')
      if (!unique.has(physicalKey)) unique.set(physicalKey, shape)
    }
  }
  return [...unique.values()].sort((left, right) => (
    Math.min(...left.notes.map(note => note.fret)) - Math.min(...right.notes.map(note => note.fret))
    || left.inversion.index - right.inversion.index
    || left.id.localeCompare(right.id)
  ))
}
