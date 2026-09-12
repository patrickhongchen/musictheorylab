import { CHORD_CATALOG, createChordTones, type ChordToneRole } from './chordCatalog'
import { validateCagedAssociations, type CagedAssociations } from './caged'
import {
  soundingBass,
  type ChordShapeInversion,
  type MajorSeventhChord,
  type PlayableChordShape,
} from './chordShapes'
import { STANDARD_TUNING } from './fretboard'
import { pitchClass } from './pitches'

export const SEVENTH_INVERSIONS: Readonly<Record<ChordToneRole, ChordShapeInversion>> = {
  root: { index: 0, name: 'Root position', figure: '7' },
  third: { index: 1, name: 'First inversion', figure: '6/5' },
  fifth: { index: 2, name: 'Second inversion', figure: '4/3' },
  seventh: { index: 3, name: 'Third inversion', figure: '4/2' },
}

interface TemplateNote {
  readonly string: number
  readonly fretOffset: number
  readonly role: ChordToneRole
}

export interface MajorSeventhShapeTemplate {
  readonly id: string
  readonly rootString: number
  readonly notes: readonly TemplateNote[]
  /** Curated regional/family associations, which may be empty or span forms.
   * They do not assert exact containment in major-triad reference geometry.
   */
  readonly cagedForms: CagedAssociations
}

const note = (string: number, fretOffset: number, role: ChordToneRole): TemplateNote => (
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
    id: 'drop2-top4-root', rootString: 4,
    notes: [note(1, 2, 'third'), note(2, 2, 'seventh'), note(3, 2, 'fifth'), note(4, 0, 'root')],
    cagedForms: ['D'],
  },
  {
    id: 'drop2-top4-first', rootString: 2,
    notes: [note(1, 2, 'fifth'), note(2, 0, 'root'), note(3, 3, 'seventh'), note(4, 1, 'third')],
    cagedForms: ['C', 'A'],
  },
  {
    id: 'drop2-top4-second', rootString: 3,
    notes: [note(1, 2, 'seventh'), note(2, 0, 'third'), note(3, 0, 'root'), note(4, 0, 'fifth')],
    cagedForms: ['G'],
  },
  {
    id: 'drop2-top4-third', rootString: 1,
    notes: [note(1, 0, 'root'), note(2, 0, 'fifth'), note(3, 1, 'third'), note(4, 1, 'seventh')],
    cagedForms: ['E'],
  },
  {
    id: 'a-root-r573', rootString: 5,
    notes: [note(2, 2, 'third'), note(3, 1, 'seventh'), note(4, 2, 'fifth'), note(5, 0, 'root')],
    cagedForms: ['A'],
  },
  {
    id: 'e-root-r735', rootString: 6,
    notes: [note(2, 0, 'fifth'), note(3, 1, 'third'), note(4, 1, 'seventh'), note(6, 0, 'root')],
    cagedForms: ['E'],
  },
  {
    id: 'a-first-37r5', rootString: 3,
    notes: [note(2, 3, 'fifth'), note(3, 0, 'root'), note(4, 4, 'seventh'), note(5, 2, 'third')],
    cagedForms: ['G', 'E'],
  },
  {
    id: 'a-second-5r37', rootString: 4,
    notes: [note(2, 2, 'seventh'), note(3, -1, 'third'), note(4, 0, 'root'), note(5, 0, 'fifth')],
    cagedForms: ['D'],
  },
  {
    id: 'a-third-735r', rootString: 2,
    notes: [note(2, 0, 'root'), note(3, -1, 'fifth'), note(4, 1, 'third'), note(5, 1, 'seventh')],
    cagedForms: ['C'],
  },
  {
    id: 'e-first-3r57', rootString: 4,
    notes: [note(2, 2, 'seventh'), note(3, 2, 'fifth'), note(4, 0, 'root'), note(6, 2, 'third')],
    cagedForms: ['D'],
  },
  {
    id: 'e-second-537r', rootString: 2,
    notes: [note(2, 0, 'root'), note(3, 3, 'seventh'), note(4, 1, 'third'), note(6, 2, 'fifth')],
    cagedForms: ['C', 'A'],
  },
  {
    id: 'e-third-75r3', rootString: 3,
    notes: [note(2, 0, 'third'), note(3, 0, 'root'), note(4, 0, 'fifth'), note(6, 2, 'seventh')],
    cagedForms: ['G'],
  },
] as const

// Validate reference identities, not subset geometry: seventh voicings are
// independently curated and may cross more than one CAGED region.
for (const template of MAJOR_SEVENTH_SHAPE_TEMPLATES) validateCagedAssociations(template.cagedForms)

export function createMajorSeventh(rootName: string): MajorSeventhChord {
  const root = pitchClass(rootName)
  return {
    id: `${root.name}:major7`, root, quality: 'major7', chordName: `${root.name} major 7`,
    tones: createChordTones(root, CHORD_CATALOG.major7),
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

  const shapes: PlayableChordShape[] = []
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
        chord, notes, cagedForms: template.cagedForms, templateId: template.id,
      } as const
      const bass = soundingBass({ ...shapeBase, inversion: SEVENTH_INVERSIONS.root })
      const shape: PlayableChordShape = { ...shapeBase, inversion: SEVENTH_INVERSIONS[bass.tone.role] }
      shapes.push(shape)
    }
  }
  return shapes.sort((left, right) => (
    Math.min(...left.notes.map(note => note.fret)) - Math.min(...right.notes.map(note => note.fret))
    || left.inversion.index - right.inversion.index
    || left.id.localeCompare(right.id)
  ))
}
