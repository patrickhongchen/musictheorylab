import { Note } from 'tonal'
import type { CagedForm } from './chordShapes'
import { STANDARD_TUNING } from './fretboard'
import { pitchClass } from './pitches'
import type { ChordToneRole, PitchClass } from './types'

export const CAGED_FORMS = ['C', 'A', 'G', 'E', 'D'] as const satisfies readonly CagedForm[]

export type CagedChordQuality = 'major' | 'minor'

interface CagedTemplateTone {
  readonly string: number
  readonly fretOffset: number
  readonly role: ChordToneRole
}

export interface CagedScalePositionTemplate {
  readonly form: CagedForm
  readonly quality: CagedChordQuality
  /** Chroma of the open-position form root before it is transposed. */
  readonly openRootChroma: number
  /** Inclusive teaching-region bounds relative to the movable form's virtual nut. */
  readonly regionStartOffset: number
  readonly regionEndOffset: number
  readonly chordTones: readonly CagedTemplateTone[]
}

export interface CagedChordToneCoordinate {
  readonly string: number
  readonly fret: number
  readonly role: ChordToneRole
  readonly pitchClass: PitchClass
}

export interface CagedScalePosition {
  readonly id: string
  readonly form: CagedForm
  readonly quality: CagedChordQuality
  readonly startFret: number
  readonly endFret: number
  /** The movable form's virtual nut/capo fret. */
  readonly anchorFret: number
  readonly chordTones: readonly CagedChordToneCoordinate[]
}

type TemplateDefinition = readonly [
  form: CagedForm,
  openRootChroma: number,
  regionStartOffset: number,
  regionEndOffset: number,
  tones: readonly (readonly [string: number, fretOffset: number, role: ChordToneRole])[],
]

const templates = (
  quality: CagedChordQuality,
  definitions: readonly TemplateDefinition[],
): readonly CagedScalePositionTemplate[] => definitions.map(([
  form, openRootChroma, regionStartOffset, regionEndOffset, tones,
]) => ({
  form, quality, openRootChroma, regionStartOffset, regionEndOffset,
  chordTones: tones.map(([string, fretOffset, role]) => ({ string, fretOffset, role })),
}))

/**
 * Movable CAGED chord geometry and its surrounding scale-position window.
 * Major and minor forms are explicit data because their thirds occupy different frets.
 */
export const CAGED_SCALE_POSITION_TEMPLATES: readonly CagedScalePositionTemplate[] = [
  ...templates('major', [
    ['C', 0, -1, 3, [[5, 3, 'root'], [4, 2, 'third'], [3, 0, 'fifth'], [2, 1, 'root'], [1, 0, 'third']]],
    ['A', 9, -1, 2, [[5, 0, 'root'], [4, 2, 'fifth'], [3, 2, 'root'], [2, 2, 'third'], [1, 0, 'fifth']]],
    ['G', 7, -1, 3, [[6, 3, 'root'], [5, 2, 'third'], [4, 0, 'fifth'], [3, 0, 'root'], [2, 0, 'third'], [1, 3, 'root']]],
    ['E', 4, -1, 2, [[6, 0, 'root'], [5, 2, 'fifth'], [4, 2, 'root'], [3, 1, 'third'], [2, 0, 'fifth'], [1, 0, 'root']]],
    ['D', 2, -1, 3, [[4, 0, 'root'], [3, 2, 'fifth'], [2, 3, 'root'], [1, 2, 'third']]],
  ]),
  ...templates('minor', [
    ['C', 0, -1, 3, [[5, 3, 'root'], [4, 1, 'third'], [3, 0, 'fifth'], [2, 1, 'root'], [1, -1, 'third']]],
    ['A', 9, -1, 2, [[5, 0, 'root'], [4, 2, 'fifth'], [3, 2, 'root'], [2, 1, 'third'], [1, 0, 'fifth']]],
    ['G', 7, -1, 3, [[6, 3, 'root'], [5, 1, 'third'], [4, 0, 'fifth'], [3, 0, 'root'], [2, -1, 'third'], [1, 3, 'root']]],
    ['E', 4, -1, 2, [[6, 0, 'root'], [5, 2, 'fifth'], [4, 2, 'root'], [3, 0, 'third'], [2, 0, 'fifth'], [1, 0, 'root']]],
    ['D', 2, -1, 3, [[4, 0, 'root'], [3, 2, 'fifth'], [2, 3, 'root'], [1, 1, 'third']]],
  ]),
] as const

const ROLE_INTERVALS: Readonly<Record<CagedChordQuality, Readonly<Record<ChordToneRole, string>>>> = {
  major: { root: '1P', third: '3M', fifth: '5P' },
  minor: { root: '1P', third: '3m', fifth: '5P' },
}

/** Places explicit CAGED reference regions for a tonic across standard tuning. */
export function createCagedScalePositions(
  tonic: string,
  quality: CagedChordQuality,
  fretCount = 22,
): readonly CagedScalePosition[] {
  if (!Number.isInteger(fretCount) || fretCount < 0) throw new Error('Fret count must be a non-negative integer')
  const root = pitchClass(tonic)
  const selected = CAGED_SCALE_POSITION_TEMPLATES.filter(template => template.quality === quality)
  const positions: CagedScalePosition[] = []

  for (const template of selected) {
    const firstAnchor = (root.chroma - template.openRootChroma + 12) % 12
    for (let anchorFret = firstAnchor; anchorFret <= fretCount; anchorFret += 12) {
      const startFret = Math.max(0, anchorFret + template.regionStartOffset)
      const endFret = Math.min(fretCount, anchorFret + template.regionEndOffset)
      const chordTones = template.chordTones.flatMap(coordinate => {
        const fret = anchorFret + coordinate.fretOffset
        if (fret < 0 || fret > fretCount) return []
        const interval = ROLE_INTERVALS[quality][coordinate.role]
        const tone = pitchClass(Note.transpose(root.name, interval))
        const open = STANDARD_TUNING[STANDARD_TUNING.length - coordinate.string]
        if ((open.midi + fret) % 12 !== tone.chroma) {
          throw new Error(`Invalid CAGED geometry: ${quality}/${template.form}`)
        }
        return [{ string: coordinate.string, fret, role: coordinate.role, pitchClass: tone }]
      })

      positions.push({
        id: `${root.name}:${quality}:${template.form}:${anchorFret}`,
        form: template.form,
        quality,
        startFret,
        endFret,
        anchorFret,
        chordTones,
      })
    }
  }

  return positions.sort((left, right) => (
    left.anchorFret - right.anchorFret || CAGED_FORMS.indexOf(left.form) - CAGED_FORMS.indexOf(right.form)
  ))
}
