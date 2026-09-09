import { ChordType, Interval, Note } from 'tonal'
import { pitchClass } from './pitches'
import { romanNumeral } from './romanNumerals'
import type { ChordQuality, ChordToneRole, Scale, ScaleDegree, Triad, IndependentTriad } from './types'

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

/** Build a triad from its own root and quality, without a parent scale. */
export function createTriad(rootName: string, quality: ChordQuality): IndependentTriad {
  const root = pitchClass(rootName)
  const intervals = {
    major: ['1P', '3M', '5P'],
    minor: ['1P', '3m', '5P'],
    diminished: ['1P', '3m', '5d'],
    augmented: ['1P', '3M', '5A'],
  }[quality]
  return {
    id: `${root.name}:${quality}`, root, quality, chordName: `${root.name} ${quality}`,
    tones: intervals.map((interval, index) => ({
      pitchClass: pitchClass(Note.transpose(root.name, interval)), role: ROLES[index], interval,
    })),
  }
}
