import { Note, Scale as TonalScale } from 'tonal'
import { pitchClass } from './pitches'
import type { Key, Scale } from './types'

/** All 15 conventional major key signatures, from seven flats to seven sharps. */
export const MAJOR_KEYS: readonly Key[] = Array.from({ length: 15 }, (_, index) => ({
  tonic: Note.transposeFifths('C', index - 7), mode: 'major' as const,
}))

export function createScale(key: Key): Scale {
  const data = TonalScale.get(`${key.tonic} ${key.mode}`)
  if (data.empty || data.notes.length !== 7) throw new Error(`Unsupported key: ${key.tonic} ${key.mode}`)
  return { key, name: data.name, notes: data.notes.map(pitchClass) }
}
