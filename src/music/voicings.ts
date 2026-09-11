import { pitch, pitchAtMidi, pitchClass } from './pitches'
import type { Inversion, PentatonicScale, Pitch, Scale, ScaleTone, Triad, TriadResult, Voicing } from './types'

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
  return harmonizeTopPitch(triads, sopranoPitch(topNote))
}

export function harmonizeTopPitch(triads: readonly Triad[], soprano: Pitch): TriadResult[] {
  return triads.filter(triad => triad.tones.some(tone => tone.pitchClass.chroma === soprano.chroma))
    .map(triad => ({ triad, voicing: closePosition(triad, soprano) }))
}

/** Places the scale in one continuously ascending soprano register. */
export function ascendingScaleSopranos(scale: Scale): readonly Pitch[] {
  const first = sopranoPitch(scale.notes[0].name)
  return scale.notes.slice(1).reduce<Pitch[]>((notes, note) => {
    const previous = notes[notes.length - 1]
    const distance = (note.chroma - previous.chroma + 12) % 12 || 12
    notes.push(pitchAtMidi(note, previous.midi + distance))
    return notes
  }, [first])
}

/** Places any ordered scale-tone collection in one ascending octave and repeats the tonic at the top. */
export function ascendingScalePitches(scale: { readonly tones: readonly ScaleTone[] }): readonly Pitch[] {
  if (scale.tones.length === 0) throw new Error('An ascending scale requires at least one tone')
  const first = pitch(`${scale.tones[0].pitchClass.name}4`)
  const pitches = scale.tones.slice(1).reduce<Pitch[]>((notes, tone) => {
    const previous = notes[notes.length - 1]
    const distance = (tone.pitchClass.chroma - previous.chroma + 12) % 12 || 12
    notes.push(pitchAtMidi(tone.pitchClass, previous.midi + distance))
    return notes
  }, [first])

  return [...pitches, pitchAtMidi(scale.tones[0].pitchClass, first.midi + 12)]
}

/** Compatibility wrapper for the original pentatonic-only API. */
export function ascendingPentatonicPitches(scale: PentatonicScale): readonly Pitch[] {
  return ascendingScalePitches(scale)
}
