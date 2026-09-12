import { Interval, Note } from 'tonal'
import { CHORD_CATALOG, createChordTones, type ChordQuality, type ChordToneRole } from './chordCatalog'
import { SCALE_CATALOG, createScaleTones, type ScaleType, type ScaleLabel } from './scaleCatalog'
import { STANDARD_TUNING } from './fretboard'
import { pitchAtMidi, pitchClass, transposePitchClassName } from './pitches'
import type { Pitch, PitchClass } from './types'

export const SOLOING_CHORD_QUALITIES = [
  'major',
  'minor',
  'diminished',
  'major7',
  'minor7',
  'dominant7',
] as const satisfies readonly ChordQuality[]

export const SOLOING_SCALE_TYPES = [
  'ionian',
  'dorian',
  'mixolydian',
  'aeolian',
  'majorPentatonic',
  'minorPentatonic',
  'blues',
] as const satisfies readonly ScaleType[]

export type SoloingChordQuality = typeof SOLOING_CHORD_QUALITIES[number]
export type SoloingScaleType = typeof SOLOING_SCALE_TYPES[number]

export const CHORD_QUALITY_LABELS: Readonly<Record<SoloingChordQuality, string>> = {
  major: 'Maj',
  minor: 'Minor',
  diminished: 'Diminished',
  major7: 'Maj7',
  minor7: 'Min7',
  dominant7: 'Dom7',
}

export const SCALE_TYPE_LABELS: Readonly<Record<SoloingScaleType, string>> = {
  ionian: 'Ionian',
  dorian: 'Dorian',
  mixolydian: 'Mixolydian',
  aeolian: 'Aeolian',
  majorPentatonic: 'Major Pentatonic',
  minorPentatonic: 'Minor Pentatonic',
  blues: 'Blues Scale',
}

export function chordQualityLabel(quality: SoloingChordQuality) {
  return CHORD_QUALITY_LABELS[quality]
}

export function scaleTypeLabel(type: SoloingScaleType) {
  return SCALE_TYPE_LABELS[type]
}

export interface SoloingChordTone {
  readonly pitchClass: PitchClass
  readonly role: ChordToneRole
  readonly interval: string
  readonly label: typeof CHORD_CATALOG[SoloingChordQuality]['labels'][number]
}

export interface SoloingChord {
  readonly root: PitchClass
  readonly quality: SoloingChordQuality
  readonly name: string
  readonly tones: readonly SoloingChordTone[]
}

export interface SoloingScaleTone {
  readonly pitchClass: PitchClass
  readonly interval: string
  readonly label: ScaleLabel<SoloingScaleType>
}

export interface SoloingScale {
  readonly root: PitchClass
  readonly type: SoloingScaleType
  readonly name: string
  readonly tones: readonly SoloingScaleTone[]
}

export interface SoloingChordSpec {
  readonly root: string
  readonly quality: SoloingChordQuality
}

export interface SoloingScaleSpec {
  readonly root: string
  readonly type: SoloingScaleType
}

export interface SoloingStep {
  readonly id: string
  readonly chord: SoloingChordSpec
  readonly scale: SoloingScaleSpec
}

export interface SoloingToneMembership {
  /** A stable chromatic degree measured from the selected scale root. */
  readonly scaleDegreeLabel: string
  readonly scaleTone?: SoloingScaleTone
  readonly currentChordTone?: SoloingChordTone
  readonly nextChordTone?: SoloingChordTone
  readonly isScaleTone: boolean
  readonly isCurrentChordTone: boolean
  readonly isNextChordTone: boolean
  readonly isSharedChordTone: boolean
  readonly isOutsideScale: boolean
}

export interface SoloingStaffTone extends SoloingToneMembership {
  readonly pitch: Pitch
}

export interface SoloingStaffModel {
  readonly scale: SoloingScale
  readonly currentChord: SoloingChord
  readonly nextChord?: SoloingChord
  readonly scaleTones: readonly SoloingStaffTone[]
  readonly outsideChordTones: readonly SoloingStaffTone[]
}

export interface SoloingFretPosition extends SoloingToneMembership {
  readonly string: number
  readonly fret: number
  readonly pitchClass: PitchClass
}

export interface SoloingFretboardModel {
  readonly tuning: readonly Pitch[]
  readonly fretStart: number
  readonly fretEnd: number
  readonly positions: readonly SoloingFretPosition[]
}

/** Creates a functionally spelled chord from the selected root and quality. */
export function createSoloingChord(rootName: string, quality: SoloingChordQuality): SoloingChord {
  const root = pitchClass(rootName)
  const definition = CHORD_CATALOG[quality]
  if (!SOLOING_CHORD_QUALITIES.includes(quality)) throw new Error(`Unsupported chord quality: ${quality}`)

  return {
    root,
    quality,
    name: `${root.name}${definition.suffix}`,
    tones: createChordTones(root, definition),
  }
}

/** Creates a scale whose note names favor simple, fretboard-friendly enharmonics. */
export function createSoloingScale(rootName: string, type: SoloingScaleType): SoloingScale {
  const root = pitchClass(rootName)
  const definition = SCALE_CATALOG[type]
  if (!SOLOING_SCALE_TYPES.includes(type)) throw new Error(`Unsupported scale type: ${type}`)
  const scale = createScaleTones(root.name, definition)

  return {
    root,
    type,
    name: `${root.name} ${SCALE_TYPE_LABELS[type]}`,
    tones: scale.tones.map(tone => ({
      ...tone,
      pitchClass: pitchClass(Note.simplify(tone.pitchClass.name)),
    })),
  }
}

export function createSoloingStepId(): string {
  return `soloing-step-${globalThis.crypto.randomUUID()}`
}

export function createSoloingStep(
  chord: SoloingChordSpec,
  scale: SoloingScaleSpec,
  id = createSoloingStepId(),
): SoloingStep {
  const chordRoot = createSoloingChord(chord.root, chord.quality).root.name
  const scaleRoot = createSoloingScale(scale.root, scale.type).root.name
  return { id, chord: { ...chord, root: chordRoot }, scale: { ...scale, root: scaleRoot } }
}

export const SEED_SOLOING_PROGRESSION: readonly SoloingStep[] = [
  createSoloingStep({ root: 'A', quality: 'dominant7' }, { root: 'A', type: 'blues' }, 'seed-a7-1'),
  createSoloingStep({ root: 'D', quality: 'dominant7' }, { root: 'A', type: 'blues' }, 'seed-d7'),
  createSoloingStep({ root: 'A', quality: 'dominant7' }, { root: 'A', type: 'blues' }, 'seed-a7-2'),
  createSoloingStep({ root: 'E', quality: 'dominant7' }, { root: 'E', type: 'mixolydian' }, 'seed-e7'),
]

export function createSeedSoloingProgression(): SoloingStep[] {
  return SEED_SOLOING_PROGRESSION.map(step => ({
    ...step,
    chord: { ...step.chord },
    scale: { ...step.scale },
  }))
}

/** Transposes every chord and scale root in a progression by a chromatic interval. */
export function transposeSoloingProgression(
  steps: readonly SoloingStep[],
  semitones: number,
): SoloingStep[] {
  if (!Number.isInteger(semitones)) {
    throw new Error('Transpose interval must be an integer number of semitones')
  }

  return steps.map(step => ({
    ...step,
    chord: { ...step.chord, root: transposePitchClassName(step.chord.root, semitones) },
    scale: { ...step.scale, root: transposePitchClassName(step.scale.root, semitones) },
  }))
}

/** Finds the immediate next step by stable identity and wraps the final step to the first. */
export function getNextSoloingStep(steps: readonly SoloingStep[], currentId: string): SoloingStep | undefined {
  if (steps.length < 2) return undefined
  const currentIndex = steps.findIndex(step => step.id === currentId)
  if (currentIndex < 0) return undefined
  return steps[(currentIndex + 1) % steps.length]
}

/** Places a scale from tonic to octave in a readable treble-staff register. */
export function ascendingSoloingScalePitches(scale: SoloingScale): readonly Pitch[] {
  const first = pitchAtMidi(scale.root, 60 + scale.root.chroma)
  const pitches = scale.tones.slice(1).reduce<Pitch[]>((notes, tone) => {
    const previous = notes[notes.length - 1]
    const distance = (tone.pitchClass.chroma - previous.chroma + 12) % 12 || 12
    notes.push(pitchAtMidi(tone.pitchClass, previous.midi + distance))
    return notes
  }, [first])
  return [...pitches, pitchAtMidi(scale.root, first.midi + 12)]
}

function findByChroma<T extends { readonly pitchClass: PitchClass }>(tones: readonly T[], chroma: number): T | undefined {
  return tones.find(tone => tone.pitchClass.chroma === chroma)
}

/** Labels any pitch relative to the selected scale root, including chromatic tones. */
export function soloingScaleDegreeLabel(root: PitchClass, note: PitchClass): string {
  const interval = Interval.get(Interval.distance(root.name, note.name))
  if (interval.empty) throw new Error(`Cannot measure ${note.name} from ${root.name}`)
  const accidental = interval.alt < 0 ? 'b'.repeat(-interval.alt) : '#'.repeat(interval.alt)
  return `${accidental}${interval.simple}`
}

function membership(
  chroma: number,
  scale: SoloingScale,
  currentChord: SoloingChord,
  nextChord?: SoloingChord,
): SoloingToneMembership {
  const scaleTone = findByChroma(scale.tones, chroma)
  const currentChordTone = findByChroma(currentChord.tones, chroma)
  const nextChordTone = nextChord && findByChroma(nextChord.tones, chroma)
  const displayedPitch = scaleTone?.pitchClass
    ?? currentChordTone?.pitchClass
    ?? nextChordTone?.pitchClass
    ?? pitchClass(Note.fromMidi(chroma + 60))
  return {
    scaleDegreeLabel: soloingScaleDegreeLabel(scale.root, displayedPitch),
    scaleTone,
    currentChordTone,
    nextChordTone,
    isScaleTone: Boolean(scaleTone),
    isCurrentChordTone: Boolean(currentChordTone),
    isNextChordTone: Boolean(nextChordTone),
    isSharedChordTone: Boolean(currentChordTone && nextChordTone),
    isOutsideScale: Boolean(!scaleTone && (currentChordTone || nextChordTone)),
  }
}

/** Builds already-classified pitches for the selected scale and optional next-chord overlay. */
export function createSoloingStaffModel(currentStep: SoloingStep, nextStep?: SoloingStep): SoloingStaffModel {
  const scale = createSoloingScale(currentStep.scale.root, currentStep.scale.type)
  const currentChord = createSoloingChord(currentStep.chord.root, currentStep.chord.quality)
  const nextChord = nextStep && createSoloingChord(nextStep.chord.root, nextStep.chord.quality)
  const scalePitches = ascendingSoloingScalePitches(scale)
  const scaleTones = scalePitches.map(pitch => ({
    pitch,
    ...membership(pitch.chroma, scale, currentChord, nextChord),
  }))
  const scaleChromas = new Set(scale.tones.map(tone => tone.pitchClass.chroma))
  const outsideByChroma = new Map<number, PitchClass>()
  ;[...currentChord.tones, ...(nextChord?.tones ?? [])].forEach(tone => {
    if (!scaleChromas.has(tone.pitchClass.chroma) && !outsideByChroma.has(tone.pitchClass.chroma)) {
      outsideByChroma.set(tone.pitchClass.chroma, tone.pitchClass)
    }
  })
  const tonicPitch = scalePitches[0]
  const outsideChordTones = [...outsideByChroma.values()]
    .map(note => {
      const distance = (note.chroma - scale.root.chroma + 12) % 12
      const pitch = pitchAtMidi(note, tonicPitch.midi + distance)
      return { pitch, ...membership(note.chroma, scale, currentChord, nextChord) }
    })
    .sort((left, right) => left.pitch.midi - right.pitch.midi)

  return { scale, currentChord, nextChord, scaleTones, outsideChordTones }
}

/** Maps scale, current-chord, and next-chord memberships across an inclusive fret range. */
export function createSoloingFretboard(
  currentStep: SoloingStep,
  nextStep?: SoloingStep,
  fretStart = 0,
  fretEnd = 22,
  tuning = STANDARD_TUNING,
): SoloingFretboardModel {
  if (!Number.isInteger(fretStart) || !Number.isInteger(fretEnd) || fretStart < 0 || fretEnd < fretStart) {
    throw new Error('A valid ascending fret range is required')
  }
  const scale = createSoloingScale(currentStep.scale.root, currentStep.scale.type)
  const currentChord = createSoloingChord(currentStep.chord.root, currentStep.chord.quality)
  const nextChord = nextStep && createSoloingChord(nextStep.chord.root, nextStep.chord.quality)
  const positions: SoloingFretPosition[] = []

  tuning.forEach((open, tuningIndex) => {
    for (let fret = fretStart; fret <= fretEnd; fret++) {
      const chroma = (open.midi + fret) % 12
      const classified = membership(chroma, scale, currentChord, nextChord)
      if (!classified.isScaleTone && !classified.isCurrentChordTone && !classified.isNextChordTone) continue
      positions.push({
        string: tuning.length - tuningIndex,
        fret,
        pitchClass: classified.scaleTone?.pitchClass
          ?? classified.currentChordTone?.pitchClass
          ?? classified.nextChordTone!.pitchClass,
        ...classified,
      })
    }
  })

  positions.sort((left, right) => left.string - right.string || left.fret - right.fret)
  return { tuning, fretStart, fretEnd, positions }
}
