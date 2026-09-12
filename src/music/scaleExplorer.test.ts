import { describe, expect, it } from 'vitest'
import { createScaleToneFretboard, STANDARD_TUNING } from './fretboard'
import { pitch } from './pitches'
import { createExplorerScale, SCALE_EXPLORER_SCALE_TYPES } from './scales'
import { ascendingScalePitches } from './voicings'

describe('Scale Explorer scale construction', () => {
  it('keeps the existing menu and feature-specific labels and CAGED anchors', () => {
    expect(SCALE_EXPLORER_SCALE_TYPES).toEqual(['majorPentatonic', 'minorPentatonic', 'ionian', 'aeolian'])
    expect(SCALE_EXPLORER_SCALE_TYPES.map(type => {
      const scale = createExplorerScale('C', type)
      return [scale.type, scale.displayName, scale.tonicChordQuality]
    })).toEqual([
      ['majorPentatonic', 'Major pentatonic', 'major'],
      ['minorPentatonic', 'Minor pentatonic', 'minor'],
      ['ionian', 'Major / Ionian', 'major'],
      ['aeolian', 'Natural minor / Aeolian', 'minor'],
    ])
  })

  it.each([
    ['ionian', ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']],
    ['aeolian', ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5']],
    ['majorPentatonic', ['C4', 'D4', 'E4', 'G4', 'A4', 'C5']],
    ['minorPentatonic', ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5']],
  ] as const)('places %s through one octave including the top tonic', (type, expected) => {
    expect(ascendingScalePitches(createExplorerScale('C', type)).map(note => note.scientific)).toEqual(expected)
  })

  it('keeps Tonal enharmonic spelling for seven-tone scales', () => {
    expect(createExplorerScale('Cb', 'ionian').tones.map(tone => tone.pitchClass.name))
      .toEqual(['Cb', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb'])
  })

  it('keeps the repeated tonic spelling across an enharmonic octave boundary', () => {
    expect(ascendingScalePitches(createExplorerScale('Cb', 'majorPentatonic')).map(note => note.scientific))
      .toEqual(['Cb4', 'Db4', 'Eb4', 'Gb4', 'Ab4', 'Cb5'])
  })
})

describe('generic Scale Explorer fretboard mapping', () => {
  it('maps all seven C Ionian tones with their degree labels across standard tuning', () => {
    const board = createScaleToneFretboard(createExplorerScale('C', 'ionian'), STANDARD_TUNING, 22)
    expect(board.positions.filter(position => position.string === 1).map(position => [
      position.fret, position.tone.pitchClass.name, position.tone.label,
    ])).toEqual([
      [0, 'E', '3'], [1, 'F', '4'], [3, 'G', '5'], [5, 'A', '6'], [7, 'B', '7'],
      [8, 'C', '1'], [10, 'D', '2'], [12, 'E', '3'], [13, 'F', '4'], [15, 'G', '5'],
      [17, 'A', '6'], [19, 'B', '7'], [20, 'C', '1'], [22, 'D', '2'],
    ])
    expect(board.positions.every(position => {
      const open = board.tuning[board.tuning.length - position.string]
      return position.tone.pitchClass.chroma === (open.midi + position.fret) % 12
    })).toBe(true)
  })

  it('honors a custom tuning and fret range', () => {
    const tuning = [pitch('C3'), pitch('E3')]
    const board = createScaleToneFretboard(createExplorerScale('C', 'minorPentatonic'), tuning, 5)

    expect(board.tuning).toBe(tuning)
    expect(board.fretCount).toBe(5)
    expect(board.positions.map(position => [position.string, position.fret, position.tone.pitchClass.name, position.tone.label]))
      .toEqual([
        [1, 1, 'F', '4'], [1, 3, 'G', '5'],
        [2, 0, 'C', '1'], [2, 3, 'Eb', 'b3'], [2, 5, 'F', '4'],
      ])
  })

  it('preserves flat-key spelling for enharmonic fret positions', () => {
    const board = createScaleToneFretboard(createExplorerScale('Cb', 'ionian'))
    const openB = board.positions.find(position => position.string === 2 && position.fret === 0)
    const openHighE = board.positions.find(position => position.string === 1 && position.fret === 0)

    expect([openB?.tone.label, openB?.tone.pitchClass.name]).toEqual(['1', 'Cb'])
    expect([openHighE?.tone.label, openHighE?.tone.pitchClass.name]).toEqual(['4', 'Fb'])
  })
})
