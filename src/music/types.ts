import type { CHORD_CATALOG, TRIAD_QUALITIES } from './chordCatalog'
import type { ScaleLabel } from './scaleCatalog'
import type { SCALE_EXPLORER_SCALE_TYPES } from './scales'

/** Spelling is retained separately from acoustic pitch class (chroma). */
export interface PitchClass {
  readonly name: string
  readonly letter: string
  readonly accidental: string
  readonly chroma: number
}
export interface Pitch extends PitchClass {
  readonly octave: number
  readonly scientific: string
  readonly midi: number
  readonly frequency: number
}
export type ScaleDegree = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type ChordQuality = typeof TRIAD_QUALITIES[number]
export type ChordToneRole = typeof CHORD_CATALOG.major.roles[number]
export type RomanNumeral = string
export interface Key { readonly tonic: string; readonly mode: 'major' }
export interface Scale { readonly key: Key; readonly name: string; readonly notes: readonly PitchClass[] }
export type ScaleExplorerScaleType = typeof SCALE_EXPLORER_SCALE_TYPES[number]
export type ScaleToneLabel = ScaleLabel<ScaleExplorerScaleType>
export interface ScaleTone {
  readonly pitchClass: PitchClass
  readonly interval: string
  readonly label: ScaleToneLabel
}
/** A UI-ready scale definition shared by the staff and fretboard views. */
export interface ExplorerScale {
  readonly tonic: string
  readonly type: ScaleExplorerScaleType
  /** Tonal's conventional scale name, including the tonic. */
  readonly name: string
  /** User-facing scale-family label without the tonic. */
  readonly displayName: string
  /** Major/minor quality of the tonic chord that anchors its CAGED positions. */
  readonly tonicChordQuality: 'major' | 'minor'
  readonly tones: readonly ScaleTone[]
}
export interface ChordTone { readonly pitchClass: PitchClass; readonly role: ChordToneRole; readonly interval: string }
export interface IndependentTriad {
  readonly id: string
  readonly root: PitchClass
  readonly chordName: string
  readonly quality: ChordQuality
  readonly tones: readonly ChordTone[]
}
export interface Triad extends IndependentTriad {
  readonly romanNumeral: RomanNumeral
  readonly scaleDegree: ScaleDegree
}
export interface VoicedNote { readonly pitch: Pitch; readonly role: ChordToneRole }
export interface Inversion { readonly index: 0 | 1 | 2; readonly name: string; readonly figure: '' | '6' | '6/4' }
export interface Voicing {
  readonly notes: readonly VoicedNote[]
  readonly bass: VoicedNote
  readonly soprano: VoicedNote
  readonly inversion: Inversion
}
export interface TriadResult { readonly triad: Triad; readonly voicing: Voicing }
export type ProgressionChordDegrees = readonly [ScaleDegree, ScaleDegree, ScaleDegree, ScaleDegree, ScaleDegree, ScaleDegree, ScaleDegree]
export interface ProgressionStep {
  readonly index: number
  readonly topDegree: ScaleDegree
  readonly topNote: PitchClass
  readonly triad: Triad
  readonly voicing: Voicing
}
export interface HarmonizedProgression { readonly scale: Scale; readonly steps: readonly ProgressionStep[] }
export interface FretPosition { readonly string: number; readonly fret: number; readonly tone: ChordTone }
export interface FretboardModel { readonly tuning: readonly Pitch[]; readonly fretCount: number; readonly positions: readonly FretPosition[] }
export interface ScaleToneFretPosition {
  readonly string: number
  readonly fret: number
  readonly tone: ScaleTone
}
export interface ScaleToneFretboardModel {
  readonly tuning: readonly Pitch[]
  readonly fretCount: number
  readonly positions: readonly ScaleToneFretPosition[]
}
/** One note from a selected close-position inversion, placed on a guitar string. */
export interface VoicingFretPosition {
  readonly string: number
  readonly fret: number
  readonly degree: ScaleDegree
  readonly tone: VoicedNote
  readonly isTopNote: boolean
}
export interface ProgressionVoicingShape {
  readonly stepIndex: number
  readonly fretOffset: number
  readonly notes: readonly VoicingFretPosition[]
}
export interface ProgressionVoicingFretboardModel {
  readonly tuning: readonly Pitch[]
  readonly fretCount: number
  readonly strings: readonly number[]
  readonly shapes: readonly ProgressionVoicingShape[]
}
