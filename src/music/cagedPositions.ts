import type { ChordToneRole, FretPosition, IndependentTriad } from './types'

export const CAGED_FORMS = ['C', 'A', 'G', 'E', 'D'] as const
export type CagedForm = typeof CAGED_FORMS[number]

interface GripCoordinate {
  readonly string: number
  readonly offset: number
  readonly role: ChordToneRole
}

export interface CagedPositionTemplate {
  readonly form: CagedForm
  readonly anchorString: number
  /** Open-string chroma of the root anchor in standard tuning. */
  readonly anchorChroma: number
  readonly region: readonly [number, number]
  readonly centerOffset: number
  /** Major grip coordinates relative to its lowest root anchor. */
  readonly grip: readonly GripCoordinate[]
}

const grip = (string: number, offset: number, role: ChordToneRole): GripCoordinate => ({ string, offset, role })

/** Standard-tuning movable forms. Regions include modest room for altered chord tones. */
export const CAGED_TEMPLATES: readonly CagedPositionTemplate[] = [
  { form: 'C', anchorString: 5, anchorChroma: 9, region: [-3, 1], centerOffset: -1.5,
    grip: [grip(5, 0, 'root'), grip(4, -1, 'third'), grip(3, -3, 'fifth'), grip(2, -2, 'root'), grip(1, -3, 'third')] },
  { form: 'A', anchorString: 5, anchorChroma: 9, region: [0, 3], centerOffset: 1,
    grip: [grip(5, 0, 'root'), grip(4, 2, 'fifth'), grip(3, 2, 'root'), grip(2, 2, 'third'), grip(1, 0, 'fifth')] },
  { form: 'G', anchorString: 6, anchorChroma: 4, region: [-3, 1], centerOffset: -1.5,
    grip: [grip(6, 0, 'root'), grip(5, -1, 'third'), grip(4, -3, 'fifth'), grip(3, -3, 'root'), grip(2, -3, 'third'), grip(1, 0, 'root')] },
  { form: 'E', anchorString: 6, anchorChroma: 4, region: [0, 3], centerOffset: 1,
    grip: [grip(6, 0, 'root'), grip(5, 2, 'fifth'), grip(4, 2, 'root'), grip(3, 1, 'third'), grip(2, 0, 'fifth'), grip(1, 0, 'root')] },
  { form: 'D', anchorString: 4, anchorChroma: 2, region: [0, 4], centerOffset: 2,
    grip: [grip(4, 0, 'root'), grip(3, 2, 'fifth'), grip(2, 3, 'root'), grip(1, 2, 'third')] },
]

export interface CagedPosition {
  readonly id: string
  readonly form: CagedForm
  readonly anchorString: number
  readonly anchorFret: number
  readonly minFret: number
  readonly maxFret: number
  readonly handCenter: number
  readonly fretCount: number
  readonly referenceGrip: readonly FretPosition[]
}

export function isInCagedPosition(note: { readonly string: number; readonly fret: number }, position: CagedPosition): boolean {
  return Number.isInteger(note.string) && note.string >= 1 && note.string <= 6
    && Number.isInteger(note.fret) && note.fret >= position.minFret && note.fret <= position.maxFret
    && note.fret >= 0 && note.fret <= position.fretCount
}

/** Enumerates root-anchored occurrences; regions are clipped at the nut and final fret. */
export function createCagedPositions(triad: IndependentTriad, fretCount = 22): readonly CagedPosition[] {
  if (!Number.isInteger(fretCount) || fretCount < 0) throw new Error('Fret count must be a non-negative integer')
  const positions: CagedPosition[] = []
  for (const template of CAGED_TEMPLATES) {
    const firstAnchor = (triad.root.chroma - template.anchorChroma + 12) % 12
    for (let anchorFret = firstAnchor; anchorFret <= fretCount; anchorFret += 12) {
      const minFret = Math.max(0, anchorFret + template.region[0])
      const maxFret = Math.min(fretCount, anchorFret + template.region[1])
      const referenceGrip = template.grip.flatMap(coordinate => {
        const tone = triad.tones.find(tone => tone.role === coordinate.role)
        if (!tone) return []
        const majorInterval = { root: 0, third: 4, fifth: 7 }[coordinate.role]
        const actualInterval = (tone.pitchClass.chroma - triad.root.chroma + 12) % 12
        const fret = anchorFret + coordinate.offset + actualInterval - majorInterval
        return fret >= minFret && fret <= maxFret ? [{ string: coordinate.string, fret, tone }] : []
      })
      positions.push({
        id: `${triad.root.chroma}:${template.form}:${anchorFret}`, form: template.form,
        anchorString: template.anchorString, anchorFret, minFret, maxFret, fretCount,
        handCenter: Math.max(minFret, Math.min(maxFret, anchorFret + template.centerOffset)), referenceGrip,
      })
    }
  }
  return positions
}

/**
 * Label an existing voicing by its closest reference grip, without filtering it.
 * Compare in an interior octave so nut/neck clipping cannot change repeat labels.
 * Exact reference-tone matches win, then region fit and distance from the hand center.
 */
export function classifyCagedForm(triad: IndependentTriad, notes: readonly FretPosition[]): CagedForm {
  if (notes.length === 0) throw new Error('CAGED classification requires notes')
  const shift = 12 - Math.floor(Math.min(...notes.map(note => note.fret)) / 12) * 12
  const normalized = notes.map(note => ({ ...note, fret: note.fret + shift }))
  const candidates = createCagedPositions(triad, Math.max(...normalized.map(note => note.fret)) + 12)
    .map(position => ({
      position,
      misses: normalized.filter(note => !position.referenceGrip.some(reference => (
        reference.string === note.string && reference.fret === note.fret && reference.tone.role === note.tone.role
      ))).length,
      outside: normalized.reduce((sum, note) => sum + Math.max(0, position.minFret - note.fret, note.fret - position.maxFret), 0),
      distance: normalized.reduce((sum, note) => sum + Math.abs(note.fret - position.handCenter), 0),
    }))
  // Some three-note fragments belong to two complete grips (notably C/D).
  // Prefer the stable CAGED form order when both are exact reference subsets.
  candidates.sort((a, b) => a.misses - b.misses || a.outside - b.outside
    || (a.misses === 0 && b.misses === 0 ? CAGED_FORMS.indexOf(a.position.form) - CAGED_FORMS.indexOf(b.position.form) : 0)
    || a.distance - b.distance
    || CAGED_FORMS.indexOf(a.position.form) - CAGED_FORMS.indexOf(b.position.form)
    || a.position.anchorFret - b.position.anchorFret)
  return candidates[0].position.form
}
