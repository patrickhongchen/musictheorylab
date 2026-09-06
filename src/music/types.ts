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
export interface ProgressionFretboardFrame {
  readonly stepIndex: number
  readonly topDegree: ScaleDegree
  readonly triad: Triad
  readonly model: FretboardModel
}
