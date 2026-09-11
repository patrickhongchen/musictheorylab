import { describe, expect, it } from 'vitest'
import { createCagedScalePositions, CAGED_FORMS, CAGED_SCALE_POSITION_TEMPLATES } from './cagedScalePositions'
import { createScaleToneFretboard, STANDARD_TUNING } from './fretboard'
import { createExplorerScale } from './scales'
import { ascendingScalePitches } from './voicings'

describe('Scale Explorer scale construction', () => {
  it.each([
    ['C', 'ionian', ['C', 'D', 'E', 'F', 'G', 'A', 'B'], ['1', '2', '3', '4', '5', '6', '7'], 'major'],
    ['A', 'aeolian', ['A', 'B', 'C', 'D', 'E', 'F', 'G'], ['1', '2', 'b3', '4', '5', 'b6', 'b7'], 'minor'],
  ] as const)('creates %s %s with degrees and tonic quality', (tonic, type, notes, labels, quality) => {
    const scale = createExplorerScale(tonic, type)
    expect(scale.tones.map(tone => tone.pitchClass.name)).toEqual(notes)
    expect(scale.tones.map(tone => tone.label)).toEqual(labels)
    expect(scale.tonicChordQuality).toBe(quality)
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
})

describe('CAGED scale-position references', () => {
  it.each(['major', 'minor'] as const)('stores five explicit %s chord-form templates', quality => {
    const templates = CAGED_SCALE_POSITION_TEMPLATES.filter(template => template.quality === quality)
    expect(templates.map(template => template.form)).toEqual(CAGED_FORMS)
    expect(templates.every(template => template.chordTones.length >= 4)).toBe(true)
  })

  it('cycles C-A-G-E-D for C and repeats the same positions 12 frets higher', () => {
    const positions = createCagedScalePositions('C', 'major')
    expect(positions.filter(position => position.anchorFret < 12).map(position => [position.form, position.anchorFret]))
      .toEqual([['C', 0], ['A', 3], ['G', 5], ['E', 8], ['D', 10]])
    for (const position of positions.filter(candidate => candidate.anchorFret <= 10)) {
      expect(positions.some(candidate => (
        candidate.form === position.form && candidate.anchorFret === position.anchorFret + 12
      ))).toBe(true)
    }
  })

  it('transposes every form by the tonic interval and clips regions to frets 0 through 22', () => {
    const c = createCagedScalePositions('C', 'major')
    const d = createCagedScalePositions('D', 'major')
    for (const form of CAGED_FORMS) {
      const cAnchor = c.find(position => position.form === form)!.anchorFret
      expect(d.some(position => position.form === form && position.anchorFret === cAnchor + 2)).toBe(true)
    }
    expect(d.every(position => position.startFret >= 0 && position.endFret <= 22)).toBe(true)
  })

  it('uses the requested tonic quality and exposes valid chord-tone coordinates', () => {
    const major = createCagedScalePositions('C', 'major')
    const minor = createCagedScalePositions('C', 'minor')
    expect(new Set(major.map(position => position.quality))).toEqual(new Set(['major']))
    expect(new Set(minor.map(position => position.quality))).toEqual(new Set(['minor']))

    const majorThird = major.find(position => position.form === 'E' && position.anchorFret === 8)!.chordTones
      .find(tone => tone.role === 'third')!
    const minorThird = minor.find(position => position.form === 'E' && position.anchorFret === 8)!.chordTones
      .find(tone => tone.role === 'third')!
    expect([majorThird.pitchClass.name, minorThird.pitchClass.name]).toEqual(['E', 'Eb'])
    expect(minorThird.fret).toBe(majorThird.fret - 1)
  })
})
