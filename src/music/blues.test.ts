import { describe, expect, it } from 'vitest'
import { ascendingBluesScalePitches, changePhrasePitches, connectGuideTones, createBluesFretboard, createTwelveBarBlues } from './blues'

describe('twelve-bar blues', () => {
  it('creates the common A turnaround form with correctly spelled dominant sevenths', () => {
    const blues = createTwelveBarBlues('A')
    expect(blues.bars.map(bar => bar.chord.name)).toEqual([
      'A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7',
    ])
    expect(blues.chords.map(chord => chord.tones.map(tone => tone.pitchClass.name))).toEqual([
      ['A', 'C#', 'E', 'G'],
      ['D', 'F#', 'A', 'C'],
      ['E', 'G#', 'B', 'D'],
    ])
    expect(blues.scale.tones.map(tone => tone.pitchClass.name)).toEqual(['A', 'C', 'D', 'Eb', 'E', 'G'])
  })

  it('marks only actual chord changes and groups the form into three phrases', () => {
    const blues = createTwelveBarBlues('C')
    expect(blues.bars.filter(bar => bar.beginsChange).map(bar => bar.index + 1)).toEqual([5, 7, 9, 10, 11, 12])
    expect(blues.bars.map(bar => bar.phrase)).toEqual([1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3])
  })

  it('connects guide tones by the smoothest available motion', () => {
    const [a7, d7, e7] = createTwelveBarBlues('A').chords
    expect(connectGuideTones(a7, d7).map(line => [line.from.pitchClass.name, line.to.pitchClass.name, line.semitones]))
      .toEqual([['C#', 'C', -1], ['G', 'F#', -1]])
    expect(connectGuideTones(a7, e7).map(line => [line.from.pitchClass.name, line.to.pitchClass.name, line.semitones]))
      .toEqual([['C#', 'D', 1], ['G', 'G#', 1]])
  })

  it('maps every displayed note to its physical fret and includes chord tones outside the base scale', () => {
    const blues = createTwelveBarBlues('A')
    const board = createBluesFretboard(blues, blues.chords[1])
    expect([board.fretStart, board.fretEnd]).toEqual([0, 22])
    expect(board.positions.some(position => position.chordTone?.pitchClass.name === 'F#' && !position.scaleTone)).toBe(true)
    expect(board.positions.some(position => position.fret === 0)).toBe(true)
    expect(board.positions.some(position => position.fret === 22)).toBe(true)
    expect(board.positions.every(position => {
      const open = board.tuning[board.tuning.length - position.string]
      return position.pitchClass.chroma === (open.midi + position.fret) % 12
    })).toBe(true)
  })

  it('preserves practical flat-key spelling and rejects invalid input', () => {
    const blues = createTwelveBarBlues('Bb')
    expect(blues.chords.map(chord => chord.name)).toEqual(['Bb7', 'Eb7', 'F7'])
    expect(blues.chords[0].tones.map(tone => tone.pitchClass.name)).toEqual(['Bb', 'D', 'F', 'Ab'])
    expect(blues.scale.tones.map(tone => tone.pitchClass.name)).toEqual(['Bb', 'Db', 'Eb', 'E', 'F', 'Ab'])
    expect(() => createTwelveBarBlues('H')).toThrow('Invalid note')
  })

  it('places the scale and change-resolution phrase in readable ascending staff registers', () => {
    const blues = createTwelveBarBlues('A')
    expect(ascendingBluesScalePitches(blues.scale).map(note => note.scientific))
      .toEqual(['A4', 'C5', 'D5', 'Eb5', 'E5', 'G5', 'A5'])
    const [approach, target] = changePhrasePitches(blues.scale.tones[5].pitchClass, blues.chords[1].tones[1].pitchClass)
    expect([approach.scientific, target.scientific]).toEqual(['G4', 'F#4'])
  })
})
