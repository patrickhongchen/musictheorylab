import { Note } from 'tonal'
import { STANDARD_TUNING } from './fretboard'
import { pitchClass } from './pitches'
import type { ChordToneRole, PitchClass } from './types'

export const CAGED_FORMS = ['C', 'A', 'G', 'E', 'D'] as const
export type CagedForm = typeof CAGED_FORMS[number]
export type CagedChordQuality = 'major' | 'minor'

/** Curated associations may name zero, one, or several reference forms.
 * They do not assert that a playable voicing is a full CAGED chord or a subset of one.
 */
export type CagedAssociations = readonly CagedForm[]

export interface CagedReferenceTone {
  readonly string: number
  readonly fretOffset: number
  readonly role: ChordToneRole
}

export interface CagedFormDefinition {
  readonly form: CagedForm
  /** Chroma of the form's root with the virtual nut at fret zero. */
  readonly openRootChroma: number
  /** Principal root used to locate the form in root-based teaching catalogs. */
  readonly primaryRootString: number
  /** Inclusive teaching region, relative to the virtual nut (anchor). */
  readonly regionStartOffset: number
  readonly regionEndOffset: number
  readonly chordTones: Readonly<Record<CagedChordQuality, readonly CagedReferenceTone[]>>
}

export interface CagedChordToneCoordinate {
  readonly string: number
  readonly fret: number
  readonly role: ChordToneRole
  readonly pitchClass: PitchClass
}

export interface CagedPosition {
  readonly id: string
  readonly form: CagedForm
  readonly quality: CagedChordQuality
  readonly startFret: number
  readonly endFret: number
  /** The movable form's virtual nut/capo fret, distinct from its root frets. */
  readonly anchorFret: number
  readonly chordTones: readonly CagedChordToneCoordinate[]
}

type Coordinate = readonly [string: number, fretOffset: number, role: ChordToneRole]
const tones = (coordinates: readonly Coordinate[]): readonly CagedReferenceTone[] => (
  coordinates.map(([string, fretOffset, role]) => ({ string, fretOffset, role }))
)

/**
 * Canonical standard-tuning reference geometry, not a library of playable grips.
 * Negative offsets in minor C/G forms are intentional reference points; placement
 * clips them at the nut. Playable triads and extended voicings own their geometry.
 */
export const CAGED_FORM_DEFINITIONS: readonly CagedFormDefinition[] = [
  {
    form: 'C', openRootChroma: 0, primaryRootString: 5,
    regionStartOffset: -1, regionEndOffset: 3,
    chordTones: {
      major: tones([[5, 3, 'root'], [4, 2, 'third'], [3, 0, 'fifth'], [2, 1, 'root'], [1, 0, 'third']]),
      minor: tones([[5, 3, 'root'], [4, 1, 'third'], [3, 0, 'fifth'], [2, 1, 'root'], [1, -1, 'third']]),
    },
  },
  {
    form: 'A', openRootChroma: 9, primaryRootString: 5,
    regionStartOffset: -1, regionEndOffset: 2,
    chordTones: {
      major: tones([[5, 0, 'root'], [4, 2, 'fifth'], [3, 2, 'root'], [2, 2, 'third'], [1, 0, 'fifth']]),
      minor: tones([[5, 0, 'root'], [4, 2, 'fifth'], [3, 2, 'root'], [2, 1, 'third'], [1, 0, 'fifth']]),
    },
  },
  {
    form: 'G', openRootChroma: 7, primaryRootString: 6,
    regionStartOffset: -1, regionEndOffset: 3,
    chordTones: {
      major: tones([[6, 3, 'root'], [5, 2, 'third'], [4, 0, 'fifth'], [3, 0, 'root'], [2, 0, 'third'], [1, 3, 'root']]),
      minor: tones([[6, 3, 'root'], [5, 1, 'third'], [4, 0, 'fifth'], [3, 0, 'root'], [2, -1, 'third'], [1, 3, 'root']]),
    },
  },
  {
    form: 'E', openRootChroma: 4, primaryRootString: 6,
    regionStartOffset: -1, regionEndOffset: 2,
    chordTones: {
      major: tones([[6, 0, 'root'], [5, 2, 'fifth'], [4, 2, 'root'], [3, 1, 'third'], [2, 0, 'fifth'], [1, 0, 'root']]),
      minor: tones([[6, 0, 'root'], [5, 2, 'fifth'], [4, 2, 'root'], [3, 0, 'third'], [2, 0, 'fifth'], [1, 0, 'root']]),
    },
  },
  {
    form: 'D', openRootChroma: 2, primaryRootString: 4,
    regionStartOffset: -1, regionEndOffset: 3,
    chordTones: {
      major: tones([[4, 0, 'root'], [3, 2, 'fifth'], [2, 3, 'root'], [1, 2, 'third']]),
      minor: tones([[4, 0, 'root'], [3, 2, 'fifth'], [2, 3, 'root'], [1, 1, 'third']]),
    },
  },
]

const ROLE_SEMITONES: Readonly<Record<CagedChordQuality, Readonly<Record<ChordToneRole, number>>>> = {
  major: { root: 0, third: 4, fifth: 7 },
  minor: { root: 0, third: 3, fifth: 7 },
}
const ROLE_INTERVALS: Readonly<Record<CagedChordQuality, Readonly<Record<ChordToneRole, string>>>> = {
  major: { root: '1P', third: '3M', fifth: '5P' },
  minor: { root: '1P', third: '3m', fifth: '5P' },
}
const modulo12 = (value: number) => ((value % 12) + 12) % 12

export function getCagedForm(form: CagedForm): CagedFormDefinition {
  const definition = CAGED_FORM_DEFINITIONS.find(candidate => candidate.form === form)
  if (!definition) throw new Error(`Unknown CAGED form: ${form}`)
  return definition
}

/** Validate all geometry before clipping, including references below fret zero. */
export function validateCagedDefinition(definition: CagedFormDefinition): void {
  const invalid = (reason: string): never => {
    throw new Error(`Invalid CAGED geometry: ${definition.form}: ${reason}`)
  }
  if (!CAGED_FORMS.includes(definition.form)) invalid('unknown form')
  if (definition.openRootChroma !== pitchClass(definition.form).chroma) invalid('open root does not match form')
  const { regionStartOffset: start, regionEndOffset: end } = definition
  if (!Number.isInteger(start) || !Number.isInteger(end) || start > 0 || end < 0) invalid('invalid neck region')
  for (const quality of ['major', 'minor'] as const) {
    const coordinates = definition.chordTones[quality]
    if (!coordinates || !['root', 'third', 'fifth'].every(role => coordinates.some(tone => tone.role === role))) {
      invalid(`${quality} requires root, third, and fifth references`)
    }
    if (new Set(coordinates.map(tone => tone.string)).size !== coordinates.length) invalid(`${quality} repeats a string`)
    for (const tone of coordinates) {
      if (!Number.isInteger(tone.string) || tone.string < 1 || tone.string > STANDARD_TUNING.length
        || !Number.isInteger(tone.fretOffset) || tone.fretOffset < start || tone.fretOffset > end) {
        invalid(`${quality} has an invalid reference coordinate`)
      }
      const open = STANDARD_TUNING[STANDARD_TUNING.length - tone.string]
      const interval = ROLE_SEMITONES[quality][tone.role]
      if (interval === undefined || modulo12(open.chroma + tone.fretOffset) !== modulo12(definition.openRootChroma + interval)) {
        invalid(`${quality} string ${tone.string} does not sound its ${tone.role}`)
      }
    }
    if (!coordinates.some(tone => tone.role === 'root' && tone.string === definition.primaryRootString)) {
      invalid(`${quality} is missing its primary root`)
    }
  }
  const roots = (quality: CagedChordQuality) => definition.chordTones[quality]
    .filter(tone => tone.role === 'root').map(tone => `${tone.string}:${tone.fretOffset}`).sort().join(',')
  if (roots('major') !== roots('minor')) invalid('major/minor root references must agree')
}

for (const definition of CAGED_FORM_DEFINITIONS) validateCagedDefinition(definition)

/** Checks curated labels without pretending that regional relationships imply subset geometry. */
export function validateCagedAssociations(forms: CagedAssociations): void {
  forms.forEach(getCagedForm)
  if (new Set(forms).size !== forms.length) throw new Error('Invalid CAGED association: duplicate form')
}

/** Roots are quality-independent, even when the playable chord alters thirds/fifths. */
export function getCagedRootReference(form: CagedForm, string = getCagedForm(form).primaryRootString): CagedReferenceTone {
  const root = getCagedForm(form).chordTones.major.find(tone => tone.role === 'root' && tone.string === string)
  if (!root) throw new Error(`Invalid CAGED association: ${form} has no root reference on string ${string}`)
  return root
}

/** Locates a form from one of its roots; a virtual nut may be below fret zero. */
export function cagedAnchorFromRoot(form: CagedForm, rootString: number, rootFret: number): number {
  if (!Number.isInteger(rootFret) || rootFret < 0) throw new Error('Root fret must be a non-negative integer')
  return rootFret - getCagedRootReference(form, rootString).fretOffset
}

/** First non-negative virtual nut for this tonic, followed by repeats every 12 frets. */
export function firstCagedAnchor(tonic: string, form: CagedForm): number {
  return modulo12(pitchClass(tonic).chroma - getCagedForm(form).openRootChroma)
}

function validateFretCount(fretCount: number): void {
  if (!Number.isInteger(fretCount) || fretCount < 0) throw new Error('Fret count must be a non-negative integer')
}

/** Place one reference form; only its visible coordinates and region are returned.
 * Virtual nuts outside the board are not emitted (the existing Scale Explorer convention).
 */
export function placeCagedForm(
  tonic: string,
  quality: CagedChordQuality,
  form: CagedForm,
  anchorFret: number,
  fretCount = 22,
): CagedPosition {
  validateFretCount(fretCount)
  const definition = getCagedForm(form)
  if (!Number.isInteger(anchorFret) || anchorFret < 0 || anchorFret > fretCount
    || modulo12(anchorFret) !== firstCagedAnchor(tonic, form)) {
    throw new Error(`Invalid CAGED anchor: ${tonic}/${form} at fret ${anchorFret}`)
  }
  const coordinates = definition.chordTones[quality]
  if (!coordinates) throw new Error(`Unsupported CAGED reference quality: ${quality}`)
  const root = pitchClass(tonic)
  return {
    id: `${root.name}:${quality}:${form}:${anchorFret}`,
    form, quality, anchorFret,
    startFret: Math.max(0, anchorFret + definition.regionStartOffset),
    endFret: Math.min(fretCount, anchorFret + definition.regionEndOffset),
    chordTones: coordinates.flatMap(coordinate => {
      const fret = anchorFret + coordinate.fretOffset
      if (fret < 0 || fret > fretCount) return []
      return [{
        string: coordinate.string, fret, role: coordinate.role,
        pitchClass: pitchClass(Note.transpose(root.name, ROLE_INTERVALS[quality][coordinate.role])),
      }]
    }),
  }
}

export function createCagedPositions(
  tonic: string,
  quality: CagedChordQuality,
  fretCount = 22,
): readonly CagedPosition[] {
  validateFretCount(fretCount)
  // Validate even when the fretboard is too short to contain a form.
  pitchClass(tonic)
  if (quality !== 'major' && quality !== 'minor') throw new Error(`Unsupported CAGED reference quality: ${quality}`)
  const positions: CagedPosition[] = []
  for (const form of CAGED_FORMS) {
    for (let anchor = firstCagedAnchor(tonic, form); anchor <= fretCount; anchor += 12) {
      positions.push(placeCagedForm(tonic, quality, form, anchor, fretCount))
    }
  }
  return positions.sort((left, right) => (
    left.anchorFret - right.anchorFret || CAGED_FORMS.indexOf(left.form) - CAGED_FORMS.indexOf(right.form)
  ))
}
