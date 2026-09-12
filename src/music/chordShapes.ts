import type { ChordToneRole } from './chordCatalog'
import type { CagedAssociations } from './caged'
import { STANDARD_TUNING } from './fretboard'
import type { ChordQuality, IndependentTriad, PitchClass } from './types'

export type VoiceLeadingQuality = ChordQuality | 'major7'

export interface MajorSeventhChordTone {
  readonly pitchClass: PitchClass
  readonly role: ChordToneRole
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
    readonly role: ChordToneRole
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
  /** Curated reference relationships; an empty list means no CAGED association. */
  readonly cagedForms: CagedAssociations
  readonly colorIndex?: number
  readonly templateId: string
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

/** Canonical template identity groups the same shape at octave repeats. */
export function chordShapeFamilyId(shape: PlayableChordShape): string {
  return `${shape.chord.id}:${shape.templateId}`
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
