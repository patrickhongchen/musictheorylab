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
export type ChordQuality = 'major' | 'minor' | 'diminished' | 'augmented'
export type ChordToneRole = 'root' | 'third' | 'fifth'
export type RomanNumeral = string
export interface Key { readonly tonic: string; readonly mode: 'major' }
export interface Scale { readonly key: Key; readonly name: string; readonly notes: readonly PitchClass[] }
export type PentatonicScaleType = 'major' | 'minor'
export type PentatonicScaleToneLabel = '1' | '2' | 'b3' | '3' | '4' | '5' | '6' | 'b7'
/** A pitch in a pentatonic scale, with both Tonal's interval and a UI-ready degree label. */
export interface PentatonicScaleTone {
  readonly pitchClass: PitchClass
  readonly interval: string
  readonly label: PentatonicScaleToneLabel
}
export interface PentatonicScale {
  readonly tonic: string
  readonly type: PentatonicScaleType
  readonly name: string
  readonly tones: readonly PentatonicScaleTone[]
}
export interface ChordTone { readonly pitchClass: PitchClass; readonly role: ChordToneRole; readonly interval: string }
export interface Triad {
  readonly id: string
  readonly root: PitchClass
  readonly chordName: string
  readonly romanNumeral: RomanNumeral
  readonly scaleDegree: ScaleDegree
  readonly quality: ChordQuality
  readonly tones: readonly ChordTone[]
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
/** A scale-note occurrence that can act as a top-note anchor on the fretboard. */
export interface ScaleFretPosition {
  readonly string: number
  readonly fret: number
  readonly degree: ScaleDegree
  readonly pitchClass: PitchClass
}
export interface ScaleFretboardModel {
  readonly tuning: readonly Pitch[]
  readonly fretCount: number
  readonly positions: readonly ScaleFretPosition[]
}
export interface PentatonicScaleFretPosition {
  readonly string: number
  readonly fret: number
  readonly tone: PentatonicScaleTone
}
export interface PentatonicScaleFretboardModel {
  readonly tuning: readonly Pitch[]
  readonly fretCount: number
  readonly positions: readonly PentatonicScaleFretPosition[]
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
export interface ProgressionFretboardFrame {
  readonly stepIndex: number
  readonly topDegree: ScaleDegree
  readonly triad: Triad
  readonly model: FretboardModel
}
/** One chord-tone occurrence at a fret, retained separately for each progression step. */
export interface ProgressionFretboardMarker {
  readonly stepIndex: number
  readonly topDegree: ScaleDegree
  readonly triad: Triad
  readonly tone: ChordTone
}
/** A physical fretboard coordinate shared by one or more progression markers. */
export interface ProgressionFretPosition {
  readonly string: number
  readonly fret: number
  readonly markers: readonly ProgressionFretboardMarker[]
}
export interface ProgressionFretboardModel {
  readonly tuning: readonly Pitch[]
  readonly fretCount: number
  readonly positions: readonly ProgressionFretPosition[]
}
