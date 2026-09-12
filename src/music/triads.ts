import { Interval } from 'tonal'
import { CHORD_CATALOG, TRIAD_QUALITIES, createChordTones } from './chordCatalog'
import { pitchClass } from './pitches'
import { romanNumeral } from './romanNumerals'
import type { ChordQuality, Scale, ScaleDegree, Triad, IndependentTriad } from './types'

export function diatonicTriads(scale: Scale): Triad[] {
  return scale.notes.map((root, index) => {
    const notes = [0, 2, 4].map(offset => scale.notes[(index + offset) % scale.notes.length])
    const intervals = notes.map(note => Interval.distance(root.name, note.name))
    const chordQuality = TRIAD_QUALITIES.find(quality => CHORD_CATALOG[quality].intervals.join(',') === intervals.join(','))
    if (!chordQuality) throw new Error(`Unsupported triad: ${notes.map(n => n.name)}`)
    const scaleDegree = (index + 1) as ScaleDegree
    return {
      id: `${scale.key.tonic}:${scale.key.mode}:${scaleDegree}`,
      root, chordName: `${root.name} ${chordQuality}`, quality: chordQuality, scaleDegree,
      romanNumeral: romanNumeral(scaleDegree, chordQuality),
      tones: notes.map((pitchClass, toneIndex) => ({ pitchClass, role: CHORD_CATALOG[chordQuality].roles[toneIndex], interval: intervals[toneIndex] })),
    }
  })
}

/** Build a triad from its own root and quality, without a parent scale. */
export function createTriad(rootName: string, quality: ChordQuality): IndependentTriad {
  const root = pitchClass(rootName)
  return {
    id: `${root.name}:${quality}`, root, quality, chordName: `${root.name} ${quality}`,
    tones: createChordTones(root, CHORD_CATALOG[quality]),
  }
}
