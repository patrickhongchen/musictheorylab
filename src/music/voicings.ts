import { pitch, pitchAtMidi, pitchClass } from './pitches'
import type { Inversion, Pitch, Triad, TriadResult, Voicing } from './types'

const INVERSIONS: readonly Inversion[] = [
  { index: 0, name: 'Root position', figure: '' },
  { index: 1, name: 'First inversion', figure: '6' },
  { index: 2, name: 'Second inversion', figure: '6/4' },
]

/** Soprano register E4–Eb5 keeps even the lowest candidates near the treble staff. */
export function sopranoPitch(name: string): Pitch {
  const note = pitchClass(name)
  let candidate = pitch(`${note.name}4`)
  if (candidate.midi < 64) candidate = pitchAtMidi(note, candidate.midi + 12)
  return candidate
}

export function closePosition(triad: Triad, soprano: Pitch): Voicing {
  if (!triad.tones.some(tone => tone.pitchClass.chroma === soprano.chroma)) {
    throw new Error(`${soprano.name} is not in ${triad.chordName}`)
  }
  // Place each chord tone at its nearest occurrence at or below the soprano.
  // Sorting these three distinct pitches yields one complete close-position chord.
  const notes = triad.tones.map(tone => {
    const distanceBelow = (soprano.chroma - tone.pitchClass.chroma + 12) % 12
    return { pitch: pitchAtMidi(tone.pitchClass, soprano.midi - distanceBelow), role: tone.role }
  }).sort((a, b) => a.pitch.midi - b.pitch.midi)
  const bass = notes[0]
  const inversionIndex = triad.tones.findIndex(tone => tone.pitchClass.chroma === bass.pitch.chroma)
  return { notes, bass, soprano: notes[notes.length - 1], inversion: INVERSIONS[inversionIndex] }
}

export function harmonizeTopNote(triads: readonly Triad[], topNote: string): TriadResult[] {
  const soprano = sopranoPitch(topNote)
  return triads.filter(triad => triad.tones.some(tone => tone.pitchClass.chroma === soprano.chroma))
    .map(triad => ({ triad, voicing: closePosition(triad, soprano) }))
}
