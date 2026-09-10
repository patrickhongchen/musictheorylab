import {
  soundingBass,
  type ChordShapeInversion,
  type PlayableChord,
  type PlayableChordShape,
  type VoiceLeadingQuality,
} from './chordShapes'
import { createMajorSeventh, createMajorSeventhShapes } from './majorSeventhShapes'
import { createTriadShapesFromTemplates } from './triadShapeTemplates'
import { createTriad } from './triads'

export type VoiceLeadingChoiceQuality = Exclude<VoiceLeadingQuality, 'augmented'>
export type TriadQuality = Exclude<VoiceLeadingChoiceQuality, 'major7'>
export type TriadVoicing = 'closed' | 'spread'
export type MajorSeventhVoicing = 'major7'
export type VoiceLeadingVoicing = TriadVoicing | MajorSeventhVoicing

export type ChordChoice =
  | { readonly id: string; readonly root: string; readonly quality: TriadQuality; readonly voicing: TriadVoicing }
  | { readonly id: string; readonly root: string; readonly quality: 'major7'; readonly voicing: MajorSeventhVoicing }

export const VOICE_LEADING_QUALITIES: readonly VoiceLeadingChoiceQuality[] = [
  'major', 'minor', 'diminished', 'major7',
]

export interface VoicingOption<Voicing extends VoiceLeadingVoicing = VoiceLeadingVoicing> {
  readonly value: Voicing
  readonly label: string
}

export const TRIAD_VOICING_OPTIONS: readonly VoicingOption<TriadVoicing>[] = [
  { value: 'closed', label: 'Closed' },
  { value: 'spread', label: 'Spread' },
]

export const MAJOR_SEVENTH_VOICING_OPTIONS: readonly VoicingOption<MajorSeventhVoicing>[] = [
  { value: 'major7', label: 'Major 7 voicings' },
]

export const LOWEST_STRING_OPTIONS = [
  { value: 0, label: 'All' },
  { value: 6, label: 'Low E' },
  { value: 5, label: 'A' },
  { value: 4, label: 'D' },
  { value: 3, label: 'G' },
] as const

export type LowestString = typeof LOWEST_STRING_OPTIONS[number]['value']

export const defaultVoicingForQuality = (quality: VoiceLeadingChoiceQuality): VoiceLeadingVoicing => (
  quality === 'major7' ? 'major7' : 'closed'
)

export const voicingOptionsForQuality = (
  quality: VoiceLeadingChoiceQuality,
): readonly VoicingOption[] => quality === 'major7' ? MAJOR_SEVENTH_VOICING_OPTIONS : TRIAD_VOICING_OPTIONS

export const voicingLabel = (voicing: VoiceLeadingVoicing): string => (
  [...TRIAD_VOICING_OPTIONS, ...MAJOR_SEVENTH_VOICING_OPTIONS]
    .find(option => option.value === voicing)?.label ?? voicing
)

function isVoicingForQuality(quality: VoiceLeadingChoiceQuality, voicing: VoiceLeadingVoicing): boolean {
  return voicingOptionsForQuality(quality).some(option => option.value === voicing)
}

/** Creates a valid, independently identified progression slot. */
export function createChordChoice(
  id: string,
  root: string,
  quality: VoiceLeadingChoiceQuality,
  voicing: VoiceLeadingVoicing = defaultVoicingForQuality(quality),
): ChordChoice {
  const normalized = isVoicingForQuality(quality, voicing) ? voicing : defaultVoicingForQuality(quality)
  return quality === 'major7'
    ? { id, root, quality, voicing: normalized as MajorSeventhVoicing }
    : { id, root, quality, voicing: normalized as TriadVoicing }
}

export interface ChordChoiceUpdate {
  readonly root?: string
  readonly quality?: VoiceLeadingChoiceQuality
  readonly voicing?: VoiceLeadingVoicing
}

export function createPlayableChordForChoice(choice: ChordChoice): PlayableChord {
  return choice.quality === 'major7'
    ? createMajorSeventh(choice.root)
    : createTriad(choice.root, choice.quality)
}

/** Normalizes voicing whenever a slot's quality or explicit voicing changes. */
export function updateChordChoice(choice: ChordChoice, update: ChordChoiceUpdate): ChordChoice {
  return createChordChoice(
    choice.id,
    update.root ?? choice.root,
    update.quality ?? choice.quality,
    update.voicing ?? choice.voicing,
  )
}

/** Updates one slot by stable identity, including when theoretical chords repeat. */
export function updateChordChoiceAt(
  choices: readonly ChordChoice[],
  id: string,
  update: ChordChoiceUpdate,
): readonly ChordChoice[] {
  return choices.map(choice => choice.id === id ? updateChordChoice(choice, update) : choice)
}

/**
 * Routes a progression choice to its explicit, deterministic shape library.
 */
export function createPlayableShapesForChord(
  choice: ChordChoice,
  { fretCount = 22 }: { readonly fretCount?: number } = {},
): readonly PlayableChordShape[] {
  if (choice.quality === 'major7') {
    return createMajorSeventhShapes(createMajorSeventh(choice.root), { fretCount })
  }

  const triad = createTriad(choice.root, choice.quality)
  return createTriadShapesFromTemplates(triad, choice.voicing, { fretCount })
}

/** Global viewing filter applied only after a chord's voicings are generated. */
export function filterShapesByLowestString(
  shapes: readonly PlayableChordShape[],
  lowestString: LowestString,
): readonly PlayableChordShape[] {
  return lowestString === 0 ? shapes : shapes.filter(shape => soundingBass(shape).string === lowestString)
}

/** Stable inversion columns derived from the unfiltered generated shape sets. */
export function collectAvailableInversions(
  shapeSets: readonly (readonly PlayableChordShape[])[],
): readonly ChordShapeInversion[] {
  const byIndex = new Map<number, ChordShapeInversion>()
  for (const shape of shapeSets.flat()) {
    if (!byIndex.has(shape.inversion.index)) byIndex.set(shape.inversion.index, shape.inversion)
  }
  return [...byIndex.values()].sort((left, right) => left.index - right.index)
}
