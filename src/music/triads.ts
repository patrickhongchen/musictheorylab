import { ChordType, Interval } from 'tonal'
import { romanNumeral } from './romanNumerals'
import type { ChordQuality, ChordToneRole, Scale, ScaleDegree, Triad } from './types'

const ROLES: readonly ChordToneRole[] = ['root', 'third', 'fifth']
const QUALITIES: readonly string[] = ['major', 'minor', 'diminished', 'augmented']

export function diatonicTriads(scale: Scale): Triad[] {
  return scale.notes.map((root, index) => {
    const notes = [0, 2, 4].map(offset => scale.notes[(index + offset) % scale.notes.length])
    const intervals = notes.map(note => Interval.distance(root.name, note.name))
    const type = ChordType.all().find(type => type.intervals.join(',') === intervals.join(','))
    const quality = type?.quality.toLowerCase()
    if (!type || !quality || !QUALITIES.includes(quality)) throw new Error(`Unsupported triad: ${notes.map(n => n.name)}`)
    const chordQuality = quality as ChordQuality
    const scaleDegree = (index + 1) as ScaleDegree
    return {
      id: `${scale.key.tonic}:${scale.key.mode}:${scaleDegree}`,
      root, chordName: `${root.name} ${chordQuality}`, quality: chordQuality, scaleDegree,
      romanNumeral: romanNumeral(scaleDegree, chordQuality),
      tones: notes.map((pitchClass, toneIndex) => ({ pitchClass, role: ROLES[toneIndex], interval: intervals[toneIndex] })),
    }
  })
}
