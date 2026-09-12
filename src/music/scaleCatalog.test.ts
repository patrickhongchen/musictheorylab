import { describe, expect, it } from 'vitest'
import { Interval } from 'tonal'
import { SCALE_CATALOG, createScaleTones } from './scaleCatalog'

describe('canonical scale theory', () => {
  it.each([
    ['ionian', ['1', '2', '3', '4', '5', '6', '7'], ['1P', '2M', '3M', '4P', '5P', '6M', '7M'], ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#']],
    ['dorian', ['1', '2', 'b3', '4', '5', '6', 'b7'], ['1P', '2M', '3m', '4P', '5P', '6M', '7m'], ['A', 'B', 'C', 'D', 'E', 'F#', 'G']],
    ['mixolydian', ['1', '2', '3', '4', '5', '6', 'b7'], ['1P', '2M', '3M', '4P', '5P', '6M', '7m'], ['A', 'B', 'C#', 'D', 'E', 'F#', 'G']],
    ['aeolian', ['1', '2', 'b3', '4', '5', 'b6', 'b7'], ['1P', '2M', '3m', '4P', '5P', '6m', '7m'], ['A', 'B', 'C', 'D', 'E', 'F', 'G']],
    ['majorPentatonic', ['1', '2', '3', '5', '6'], ['1P', '2M', '3M', '5P', '6M'], ['A', 'B', 'C#', 'E', 'F#']],
    ['minorPentatonic', ['1', 'b3', '4', '5', 'b7'], ['1P', '3m', '4P', '5P', '7m'], ['A', 'C', 'D', 'E', 'G']],
    ['blues', ['1', 'b3', '4', 'b5', '5', 'b7'], ['1P', '3m', '4P', '5d', '5P', '7m'], ['A', 'C', 'D', 'Eb', 'E', 'G']],
  ] as const)('%s matches its degrees and Tonal formula across roots', (type, labels, intervals, notes) => {
    const definition = SCALE_CATALOG[type]
    expect(definition.labels).toEqual(labels)
    expect(createScaleTones('A', definition).tones.map(tone => tone.pitchClass.name)).toEqual(notes)
    for (const root of ['C', 'F#', 'Gb', 'Cb', 'Bb']) {
      const scale = createScaleTones(root, definition)
      expect(scale.tones.map(tone => tone.label)).toEqual(labels)
      expect(scale.tones.map(tone => tone.interval)).toEqual(intervals)
      expect(scale.tones.map(tone => Interval.distance(root, tone.pitchClass.name))).toEqual(intervals)
    }
  })

  it.each([
    ['Cb', 'ionian', ['Cb', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb']],
    ['F#', 'majorPentatonic', ['F#', 'G#', 'A#', 'C#', 'D#']],
    ['Gb', 'minorPentatonic', ['Gb', 'Bbb', 'Cb', 'Db', 'Fb']],
    ['Bb', 'blues', ['Bb', 'Db', 'Eb', 'Fb', 'F', 'Ab']],
  ] as const)('preserves %s %s enharmonics before presentation', (root, type, notes) => {
    expect(createScaleTones(root, SCALE_CATALOG[type]).tones.map(tone => tone.pitchClass.name)).toEqual(notes)
  })

  it('rejects invalid roots', () => {
    expect(() => createScaleTones('H', SCALE_CATALOG.ionian)).toThrow('Unsupported scale')
  })
})
