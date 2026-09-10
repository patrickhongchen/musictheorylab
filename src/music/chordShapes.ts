import type { MajorSeventhCagedRegion } from './majorSeventhCaged'
import type { CagedForm, CagedPosition } from './cagedPositions'
import { STANDARD_TUNING } from './fretboard'
import { triadShapeFamilyId, type TriadShape } from './triadShapes'
import type { ChordQuality, IndependentTriad, PitchClass } from './types'
import type { VoicingLayout } from './voicingPatterns'

export type VoiceLeadingQuality = ChordQuality | 'major7'
export type PlayableChordToneRole = 'root' | 'third' | 'fifth' | 'seventh'

export interface MajorSeventhChordTone {
  readonly pitchClass: PitchClass
  readonly role: PlayableChordToneRole
  readonly interval: string
}

export interface MajorSeventhChord {
  readonly id: string
  readonly root: PitchClass
  readonly chordName: string
  readonly quality: 'major7'
  readonly tones: readonly MajorSeventhChordTone[]
}

export type PlayableChord = IndependentTriad | MajorSeventhChord

export interface PlayableChordNote {
  readonly string: number
  readonly fret: number
  readonly tone: {
    readonly pitchClass: PitchClass
    readonly role: PlayableChordToneRole
    readonly interval: string
  }
}

export interface ChordShapeInversion {
  readonly index: 0 | 1 | 2 | 3
  readonly name: string
  readonly figure: string
}

export interface PlayableChordShape {
  readonly id: string
  readonly chord: PlayableChord
  readonly notes: readonly PlayableChordNote[]
  readonly inversion: ChordShapeInversion
  readonly compatibleCagedRegions?: readonly MajorSeventhCagedRegion[]
  readonly cagedForm?: CagedForm
  readonly cagedPosition?: CagedPosition
  readonly layout?: VoicingLayout | 'drop2' | 'curated'
  readonly colorIndex?: number
  readonly templateId?: string
  readonly templateName?: string
  readonly rootAnchor?: { readonly string: number; readonly fret: number }
  readonly mutedStrings?: readonly number[]
  /** Precomputed only by adapters that preserve an existing shape family. */
  readonly familyId?: string
}

/** Adapt generated triads without changing their persistent shape identity. */
export function fromTriadShape(shape: TriadShape): PlayableChordShape {
  return {
    id: shape.id,
    chord: shape.triad,
    notes: shape.notes,
    inversion: shape.inversion,
    cagedForm: shape.cagedForm,
    cagedPosition: shape.cagedPosition,
    layout: shape.layout,
    colorIndex: shape.colorIndex,
    familyId: triadShapeFamilyId(shape),
  }
}

/** Lowest note by actual standard-tuning pitch, independent of array or role order. */
export function soundingBass(shape: PlayableChordShape): PlayableChordNote {
  if (shape.notes.length === 0) throw new Error('A playable chord shape requires at least one note')
  return shape.notes.reduce((bass, note) => {
    const bassMidi = STANDARD_TUNING[STANDARD_TUNING.length - bass.string].midi + bass.fret
    const noteMidi = STANDARD_TUNING[STANDARD_TUNING.length - note.string].midi + note.fret
    return noteMidi < bassMidi ? note : bass
  })
}

/** Same strings and geometry, translated only by whole octaves. */
export function chordShapeFamilyId(shape: PlayableChordShape): string {
  if (shape.familyId) return shape.familyId
  if (shape.templateId) return `${shape.chord.id}:${shape.templateId}`
  const octaveOffset = Math.floor(Math.min(...shape.notes.map(note => note.fret)) / 12) * 12
  const layout = shape.layout === 'spread' ? `:spread:${shape.cagedPosition?.form ?? ''}` : ''
  return `${shape.chord.id}${layout}:${shape.notes.map(note => `${note.string}:${note.fret - octaveOffset}`).join('|')}`
}

export function groupChordShapeRepeats(
  shapes: readonly PlayableChordShape[],
): readonly (readonly PlayableChordShape[])[] {
  const groups = new Map<string, PlayableChordShape[]>()
  for (const shape of shapes) {
    const id = chordShapeFamilyId(shape)
    const group = groups.get(id) ?? []
    group.push(shape)
    groups.set(id, group)
  }
  return [...groups.values()].map(group => group.sort((left, right) => left.notes[0].fret - right.notes[0].fret))
}
