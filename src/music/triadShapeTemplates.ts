import { soundingBass, type CagedForm, type PlayableChordShape } from './chordShapes'
import { STANDARD_TUNING } from './fretboard'
import type { ChordQuality, ChordToneRole, IndependentTriad } from './types'
import { TRIAD_INVERSIONS, type VoicingLayout } from './voicingPatterns'

interface TriadTemplateNote {
  readonly string: number
  readonly fretOffset: number
  readonly role: ChordToneRole
}

export interface TriadShapeTemplate {
  readonly id: string
  readonly quality: ChordQuality
  readonly voicing: VoicingLayout
  /** The fret occupied by the root on this string is the template's zero point. */
  readonly rootString: number
  readonly notes: readonly TriadTemplateNote[]
  readonly cagedForm: CagedForm
  /** Spread metadata: CAGED anchor fret relative to the root zero point. */
  readonly cagedAnchorOffset?: number
}

type Coordinate = readonly [string: number, fretOffset: number, role: ChordToneRole]
type ClosedDefinition = readonly [id: string, rootString: number, cagedForm: CagedForm, notes: readonly Coordinate[]]
type SpreadDefinition = readonly [id: string, rootString: number, cagedForm: CagedForm, cagedAnchorOffset: number, notes: readonly Coordinate[]]

const coordinates = (values: readonly Coordinate[]): readonly TriadTemplateNote[] => (
  values.map(([string, fretOffset, role]) => ({ string, fretOffset, role }))
)

const closed = (quality: ChordQuality, definitions: readonly ClosedDefinition[]): readonly TriadShapeTemplate[] => (
  definitions.map(([id, rootString, cagedForm, notes]) => ({
    id, quality, voicing: 'closed', rootString, cagedForm, notes: coordinates(notes),
  }))
)

const spread = (quality: ChordQuality, definitions: readonly SpreadDefinition[]): readonly TriadShapeTemplate[] => (
  definitions.map(([id, rootString, cagedForm, cagedAnchorOffset, notes]) => ({
    id, quality, voicing: 'spread', rootString, cagedForm, cagedAnchorOffset, notes: coordinates(notes),
  }))
)

/**
 * Curated, root-relative guitar geometry. Quality variants are deliberately
 * explicit: altered thirds and
 * fifths are data here, rather than adjustments made by placement logic.
 */
export const TRIAD_SHAPE_TEMPLATES: readonly TriadShapeTemplate[] = [
  ...closed('major', [
    ['closed-123-second', 2, 'C', [[1, -1, 'third'], [2, 0, 'root'], [3, -1, 'fifth']]],
    ['closed-123-root', 3, 'A', [[1, -2, 'fifth'], [2, 0, 'third'], [3, 0, 'root']]],
    ['closed-123-first', 1, 'E', [[1, 0, 'root'], [2, 0, 'fifth'], [3, 1, 'third']]],
    ['closed-234-first', 2, 'C', [[2, 0, 'root'], [3, -1, 'fifth'], [4, 1, 'third']]],
    ['closed-234-second', 3, 'A', [[2, 0, 'third'], [3, 0, 'root'], [4, 0, 'fifth']]],
    ['closed-234-root', 4, 'E', [[2, -2, 'fifth'], [3, -1, 'third'], [4, 0, 'root']]],
    ['closed-345-root', 5, 'C', [[3, -3, 'fifth'], [4, -1, 'third'], [5, 0, 'root']]],
    ['closed-345-first', 3, 'G', [[3, 0, 'root'], [4, 0, 'fifth'], [5, 2, 'third']]],
    ['closed-345-second', 4, 'E', [[3, -1, 'third'], [4, 0, 'root'], [5, 0, 'fifth']]],
    ['closed-456-second', 5, 'C', [[4, -1, 'third'], [5, 0, 'root'], [6, 0, 'fifth']]],
    ['closed-456-root', 6, 'G', [[4, -3, 'fifth'], [5, -1, 'third'], [6, 0, 'root']]],
    ['closed-456-first', 4, 'E', [[4, 0, 'root'], [5, 0, 'fifth'], [6, 2, 'third']]],
  ]),
  ...spread('major', [
    ['spread-245-root', 5, 'A', 0, [[2, 2, 'third'], [4, 2, 'fifth'], [5, 0, 'root']]],
    ['spread-124-first', 2, 'C', 2, [[1, 2, 'fifth'], [2, 0, 'root'], [4, 1, 'third']]],
    ['spread-246-second', 2, 'C', 2, [[2, 0, 'root'], [4, 1, 'third'], [6, 2, 'fifth']]],
    ['spread-356-root', 6, 'E', 0, [[3, 1, 'third'], [5, 2, 'fifth'], [6, 0, 'root']]],
    ['spread-235-first', 3, 'G', 3, [[2, 3, 'fifth'], [3, 0, 'root'], [5, 2, 'third']]],
    ['spread-135-second', 1, 'E', 0, [[1, 0, 'root'], [3, 1, 'third'], [5, 2, 'fifth']]],
    ['spread-124-second', 1, 'G', 0, [[1, 0, 'root'], [2, -3, 'third'], [4, -3, 'fifth']]],
    ['spread-134-root', 4, 'D', 0, [[1, 2, 'third'], [3, 2, 'fifth'], [4, 0, 'root']]],
    ['spread-346-first', 4, 'D', 0, [[3, 2, 'fifth'], [4, 0, 'root'], [6, 2, 'third']]],
  ]),
  ...closed('minor', [
    ['closed-123-root', 3, 'A', [[1, -2, 'fifth'], [2, -1, 'third'], [3, 0, 'root']]],
    ['closed-123-first', 1, 'E', [[1, 0, 'root'], [2, 0, 'fifth'], [3, 0, 'third']]],
    ['closed-123-second', 2, 'D', [[1, -2, 'third'], [2, 0, 'root'], [3, -1, 'fifth']]],
    ['closed-234-first', 2, 'C', [[2, 0, 'root'], [3, -1, 'fifth'], [4, 0, 'third']]],
    ['closed-234-second', 3, 'A', [[2, -1, 'third'], [3, 0, 'root'], [4, 0, 'fifth']]],
    ['closed-234-root', 4, 'E', [[2, -2, 'fifth'], [3, -2, 'third'], [4, 0, 'root']]],
    ['closed-345-root', 5, 'C', [[3, -3, 'fifth'], [4, -2, 'third'], [5, 0, 'root']]],
    ['closed-345-first', 3, 'G', [[3, 0, 'root'], [4, 0, 'fifth'], [5, 1, 'third']]],
    ['closed-345-second', 4, 'E', [[3, -2, 'third'], [4, 0, 'root'], [5, 0, 'fifth']]],
    ['closed-456-second', 5, 'C', [[4, -2, 'third'], [5, 0, 'root'], [6, 0, 'fifth']]],
    ['closed-456-root', 6, 'G', [[4, -3, 'fifth'], [5, -2, 'third'], [6, 0, 'root']]],
    ['closed-456-first', 4, 'E', [[4, 0, 'root'], [5, 0, 'fifth'], [6, 1, 'third']]],
  ]),
  ...spread('minor', [
    ['spread-245-root', 5, 'A', 0, [[2, 1, 'third'], [4, 2, 'fifth'], [5, 0, 'root']]],
    ['spread-124-first', 2, 'C', 2, [[1, 2, 'fifth'], [2, 0, 'root'], [4, 0, 'third']]],
    ['spread-246-second', 2, 'C', 2, [[2, 0, 'root'], [4, 0, 'third'], [6, 2, 'fifth']]],
    ['spread-356-root', 6, 'E', 0, [[3, 0, 'third'], [5, 2, 'fifth'], [6, 0, 'root']]],
    ['spread-235-first', 3, 'G', 3, [[2, 3, 'fifth'], [3, 0, 'root'], [5, 1, 'third']]],
    ['spread-135-second', 1, 'E', 0, [[1, 0, 'root'], [3, 0, 'third'], [5, 2, 'fifth']]],
    ['spread-134-second', 1, 'G', 0, [[1, 0, 'root'], [3, 0, 'third'], [4, -3, 'fifth']]],
    ['spread-134-root', 4, 'D', 0, [[1, 1, 'third'], [3, 2, 'fifth'], [4, 0, 'root']]],
    ['spread-346-first', 4, 'D', 0, [[3, 2, 'fifth'], [4, 0, 'root'], [6, 1, 'third']]],
  ]),
  ...closed('diminished', [
    ['closed-123-root', 3, 'A', [[1, -3, 'fifth'], [2, -1, 'third'], [3, 0, 'root']]],
    ['closed-123-first', 1, 'E', [[1, 0, 'root'], [2, -1, 'fifth'], [3, 0, 'third']]],
    ['closed-123-second', 2, 'D', [[1, -2, 'third'], [2, 0, 'root'], [3, -2, 'fifth']]],
    ['closed-234-second', 3, 'A', [[2, -1, 'third'], [3, 0, 'root'], [4, -1, 'fifth']]],
    ['closed-234-root', 4, 'E', [[2, -3, 'fifth'], [3, -2, 'third'], [4, 0, 'root']]],
    ['closed-234-first', 2, 'D', [[2, 0, 'root'], [3, -2, 'fifth'], [4, 0, 'third']]],
    ['closed-345-first', 3, 'A', [[3, 0, 'root'], [4, -1, 'fifth'], [5, 1, 'third']]],
    ['closed-345-second', 4, 'E', [[3, -2, 'third'], [4, 0, 'root'], [5, -1, 'fifth']]],
    ['closed-345-root', 5, 'C', [[3, -4, 'fifth'], [4, -2, 'third'], [5, 0, 'root']]],
    ['closed-456-second', 5, 'C', [[4, -2, 'third'], [5, 0, 'root'], [6, -1, 'fifth']]],
    ['closed-456-root', 6, 'G', [[4, -4, 'fifth'], [5, -2, 'third'], [6, 0, 'root']]],
    ['closed-456-first', 4, 'E', [[4, 0, 'root'], [5, -1, 'fifth'], [6, 1, 'third']]],
  ]),
  ...spread('diminished', [
    ['spread-245-root', 5, 'A', 0, [[2, 1, 'third'], [4, 1, 'fifth'], [5, 0, 'root']]],
    ['spread-124-first', 2, 'C', 2, [[1, 1, 'fifth'], [2, 0, 'root'], [4, 0, 'third']]],
    ['spread-246-second', 2, 'C', 2, [[2, 0, 'root'], [4, 0, 'third'], [6, 1, 'fifth']]],
    ['spread-356-root', 6, 'E', 0, [[3, 0, 'third'], [5, 1, 'fifth'], [6, 0, 'root']]],
    ['spread-235-first', 3, 'G', 3, [[2, 2, 'fifth'], [3, 0, 'root'], [5, 1, 'third']]],
    ['spread-135-second', 1, 'E', 0, [[1, 0, 'root'], [3, 0, 'third'], [5, 1, 'fifth']]],
    ['spread-134-root', 4, 'D', 0, [[1, 1, 'third'], [3, 1, 'fifth'], [4, 0, 'root']]],
    ['spread-346-first', 4, 'D', 0, [[3, 1, 'fifth'], [4, 0, 'root'], [6, 1, 'third']]],
  ]),
  ...closed('augmented', [
    ['closed-123-second', 2, 'C', [[1, -1, 'third'], [2, 0, 'root'], [3, 0, 'fifth']]],
    ['closed-123-root', 3, 'A', [[1, -1, 'fifth'], [2, 0, 'third'], [3, 0, 'root']]],
    ['closed-123-first', 1, 'E', [[1, 0, 'root'], [2, 1, 'fifth'], [3, 1, 'third']]],
    ['closed-234-first', 2, 'C', [[2, 0, 'root'], [3, 0, 'fifth'], [4, 1, 'third']]],
    ['closed-234-second', 3, 'A', [[2, 0, 'third'], [3, 0, 'root'], [4, 1, 'fifth']]],
    ['closed-234-root', 4, 'E', [[2, -1, 'fifth'], [3, -1, 'third'], [4, 0, 'root']]],
    ['closed-345-root', 5, 'C', [[3, -2, 'fifth'], [4, -1, 'third'], [5, 0, 'root']]],
    ['closed-345-first', 3, 'G', [[3, 0, 'root'], [4, 1, 'fifth'], [5, 2, 'third']]],
    ['closed-345-second', 4, 'E', [[3, -1, 'third'], [4, 0, 'root'], [5, 1, 'fifth']]],
    ['closed-456-second', 5, 'C', [[4, -1, 'third'], [5, 0, 'root'], [6, 1, 'fifth']]],
    ['closed-456-root', 6, 'G', [[4, -2, 'fifth'], [5, -1, 'third'], [6, 0, 'root']]],
    ['closed-456-first', 4, 'E', [[4, 0, 'root'], [5, 1, 'fifth'], [6, 2, 'third']]],
  ]),
  ...spread('augmented', [
    ['spread-135-root', 5, 'C', 0, [[1, -3, 'third'], [3, -2, 'fifth'], [5, 0, 'root']]],
    ['spread-124-first', 2, 'C', 2, [[1, 3, 'fifth'], [2, 0, 'root'], [4, 1, 'third']]],
    ['spread-246-second', 2, 'C', 2, [[2, 0, 'root'], [4, 1, 'third'], [6, 3, 'fifth']]],
    ['spread-356-root', 6, 'E', 0, [[3, 1, 'third'], [5, 3, 'fifth'], [6, 0, 'root']]],
    ['spread-135-second', 1, 'E', 0, [[1, 0, 'root'], [3, 1, 'third'], [5, 3, 'fifth']]],
    ['spread-124-second', 1, 'G', 0, [[1, 0, 'root'], [2, -3, 'third'], [4, -2, 'fifth']]],
    ['spread-134-root', 4, 'D', 0, [[1, 2, 'third'], [3, 3, 'fifth'], [4, 0, 'root']]],
    ['spread-346-first', 4, 'D', 0, [[3, 3, 'fifth'], [4, 0, 'root'], [6, 2, 'third']]],
  ]),
] as const

function firstRootFret(triad: IndependentTriad, template: TriadShapeTemplate): number {
  const open = STANDARD_TUNING[STANDARD_TUNING.length - template.rootString]
  return (triad.root.chroma - open.chroma + 12) % 12
}

function inversionForShape(shape: Parameters<typeof soundingBass>[0]) {
  const role = soundingBass(shape).tone.role
  if (role === 'seventh') throw new Error('Triad templates cannot have a seventh in the bass')
  return TRIAD_INVERSIONS[role]
}

/** Deterministically transposes known triad geometry and repeats it by octave. */
export function createTriadShapesFromTemplates(
  triad: IndependentTriad,
  voicing: VoicingLayout,
  { fretCount = 22 }: { readonly fretCount?: number } = {},
): readonly PlayableChordShape[] {
  if (!Number.isInteger(fretCount) || fretCount < 0) throw new Error('Fret count must be a non-negative integer')
  if (triad.tones.length !== 3 || !['root', 'third', 'fifth'].every(role => triad.tones.some(tone => tone.role === role))) {
    throw new Error('Triad templates require one root, third, and fifth')
  }

  const templates = TRIAD_SHAPE_TEMPLATES.filter(template => (
    template.quality === triad.quality && template.voicing === voicing
  ))
  const templateOrder = new Map(templates.map((template, index) => [template.id, index]))
  const shapes: { readonly shape: PlayableChordShape; readonly sortAnchor: number }[] = []

  for (const template of templates) {
    for (let rootFret = firstRootFret(triad, template); rootFret <= fretCount; rootFret += 12) {
      const notes = template.notes.map(coordinate => ({
        string: coordinate.string,
        fret: rootFret + coordinate.fretOffset,
        tone: triad.tones.find(tone => tone.role === coordinate.role)!,
      }))
      if (notes.some(note => note.fret < 0 || note.fret > fretCount)) continue
      if (notes.some(note => (
        (STANDARD_TUNING[STANDARD_TUNING.length - note.string].midi + note.fret) % 12
        !== note.tone.pitchClass.chroma
      ))) throw new Error(`Invalid triad geometry: ${triad.quality}/${template.id}`)

      const cagedAnchorFret = rootFret + (template.cagedAnchorOffset ?? 0)
      // A spread grip belongs to a root-anchored teaching region, so omit it
      // when that region's anchor falls beyond the final fret.
      if (voicing === 'spread' && cagedAnchorFret > fretCount) continue
      const base = {
        id: `${triad.id}:${template.id}:${rootFret}`,
        chord: triad,
        notes,
        inversion: TRIAD_INVERSIONS.root,
        cagedForms: [template.cagedForm],
        templateId: template.id,
      } as const
      shapes.push({ shape: { ...base, inversion: inversionForShape(base) }, sortAnchor: cagedAnchorFret })
    }
  }

  return shapes.sort((left, right) => {
    if (voicing === 'closed') {
      return left.shape.notes[0].string - right.shape.notes[0].string
        || left.shape.notes[0].fret - right.shape.notes[0].fret
        || left.shape.notes[1].fret - right.shape.notes[1].fret
        || left.shape.notes[2].fret - right.shape.notes[2].fret
    }
    return left.sortAnchor - right.sortAnchor
      || left.shape.inversion.index - right.shape.inversion.index
      || templateOrder.get(left.shape.templateId)! - templateOrder.get(right.shape.templateId)!
  }).map(candidate => candidate.shape)
}
