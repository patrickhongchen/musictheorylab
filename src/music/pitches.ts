import { Note } from 'tonal'
import type { Pitch, PitchClass } from './types'

export const CHROMATIC_PITCH_CLASS_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const

export function pitchClass(name: string): PitchClass {
  const note = Note.get(name)
  if (note.empty) throw new Error(`Invalid note: ${name}`)
  return { name: note.pc, letter: note.letter, accidental: note.acc, chroma: note.chroma }
}

/** Transpose a pitch-class name to a simple, fretboard-friendly spelling. */
export function transposePitchClassName(name: string, semitones: number): string {
  if (!Number.isInteger(semitones)) throw new Error('Transpose interval must be an integer number of semitones')
  const chroma = pitchClass(name).chroma
  return CHROMATIC_PITCH_CLASS_NAMES[(chroma + semitones % 12 + 12) % 12]
}

export function pitch(name: string): Pitch {
  const note = Note.get(name)
  if (note.empty || note.oct === undefined || note.midi === null || note.freq === null) {
    throw new Error(`An octave-qualified pitch is required: ${name}`)
  }
  return { ...pitchClass(name), octave: note.oct, scientific: note.name, midi: note.midi, frequency: note.freq }
}

/** Preserve spelling even across octave boundaries: B#3 = C4, Cb4 = B3. */
export function pitchAtMidi(note: PitchClass, midi: number): Pitch {
  const spelling = Note.enharmonic(Note.fromMidi(midi), note.name)
  const result = pitch(spelling)
  if (result.midi !== midi) throw new Error(`Pitch ${note.name} does not match MIDI ${midi}`)
  return result
}
