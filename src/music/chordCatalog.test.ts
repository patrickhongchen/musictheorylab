import { describe, expect, expectTypeOf, it } from 'vitest'
import { CHORD_CATALOG, createChordTones } from './chordCatalog'
import { pitchClass } from './pitches'

describe('canonical chord theory', () => {
  it.each([
    ['major', ['1P', '3M', '5P'], ['1', '3', '5'], ['', ['C', 'E', 'G'], ['Bb', 'D', 'F'], ['G#', 'B#', 'D#']]],
    ['minor', ['1P', '3m', '5P'], ['1', 'b3', '5'], ['m', ['C', 'Eb', 'G'], ['Bb', 'Db', 'F'], ['G#', 'B', 'D#']]],
    ['diminished', ['1P', '3m', '5d'], ['1', 'b3', 'b5'], ['dim', ['C', 'Eb', 'Gb'], ['Bb', 'Db', 'Fb'], ['G#', 'B', 'D']]],
    ['augmented', ['1P', '3M', '5A'], ['1', '3', '#5'], ['aug', ['C', 'E', 'G#'], ['Bb', 'D', 'F#'], ['G#', 'B#', 'D##']]],
    ['major7', ['1P', '3M', '5P', '7M'], ['1', '3', '5', '7'], ['maj7', ['C', 'E', 'G', 'B'], ['Bb', 'D', 'F', 'A'], ['G#', 'B#', 'D#', 'F##']]],
    ['minor7', ['1P', '3m', '5P', '7m'], ['1', 'b3', '5', 'b7'], ['m7', ['C', 'Eb', 'G', 'Bb'], ['Bb', 'Db', 'F', 'Ab'], ['G#', 'B', 'D#', 'F#']]],
    ['dominant7', ['1P', '3M', '5P', '7m'], ['1', '3', '5', 'b7'], ['7', ['C', 'E', 'G', 'Bb'], ['Bb', 'D', 'F', 'Ab'], ['G#', 'B#', 'D#', 'F#']]],
  ] as const)('%s has one formula and retains functional spelling across roots', (quality, intervals, labels, [suffix, ...spellings]) => {
    const definition = CHORD_CATALOG[quality]
    expect(definition.intervals).toEqual(intervals)
    expect(definition.labels).toEqual(labels)
    expect(definition.suffix).toBe(suffix)
    expect(definition.roles).toEqual(['root', 'third', 'fifth', 'seventh'].slice(0, intervals.length))
    for (const notes of spellings) {
      const tones = createChordTones(pitchClass(notes[0]), definition)
      expect(tones.map(tone => tone.pitchClass.name)).toEqual(notes)
      expect(tones.map(tone => tone.interval)).toEqual(intervals)
      expect(tones.map(tone => tone.label)).toEqual(labels)
      expect(tones.map(tone => tone.role)).toEqual(definition.roles)
    }
  })

  it('retains narrow triad roles and dominant degree labels', () => {
    const triad = createChordTones(pitchClass('C'), CHORD_CATALOG.major)
    const dominant = createChordTones(pitchClass('C'), CHORD_CATALOG.dominant7)
    expectTypeOf(triad[0].role).toEqualTypeOf<'root' | 'third' | 'fifth'>()
    expectTypeOf(dominant[0].label).toEqualTypeOf<'1' | '3' | '5' | 'b7'>()
  })
})
