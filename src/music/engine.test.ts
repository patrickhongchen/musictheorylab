import { describe, expect, it } from 'vitest'
import { createPentatonicScale, createScale, MAJOR_KEYS } from './scales'
import { diatonicTriads } from './triads'
import { ascendingPentatonicPitches, ascendingScaleSopranos, closePosition, harmonizeTopNote, sopranoPitch } from './voicings'
import { pitch, pitchAtMidi, pitchClass, transposePitchClassName } from './pitches'
import { createFretboard, createPentatonicScaleFretboard, createProgressionFretboard, createProgressionVoicingFretboard, createScaleFretboard } from './fretboard'
import { createProgression, DEFAULT_PROGRESSION_DEGREES, harmonizationChoices } from './progressions'
import type { ProgressionChordDegrees } from './types'

const explore = (tonic: string, soprano: string) => harmonizeTopNote(diatonicTriads(createScale({ tonic, mode: 'major' })), soprano)

describe('C major / G acceptance case', () => {
  const results = explore('C', 'G')
  it('returns exactly I, iii, V with their names and chord tones', () => {
    expect(results.map(({ triad }) => [triad.romanNumeral, triad.chordName, triad.tones.map(t => t.pitchClass.name)]))
      .toEqual([['I', 'C major', ['C', 'E', 'G']], ['iii', 'E minor', ['E', 'G', 'B']], ['V', 'G major', ['G', 'B', 'D']]])
  })
  it('creates the specified actual pitches, ordered bass to soprano', () => {
    expect(results.map(r => r.voicing.notes.map(n => n.pitch.scientific)))
      .toEqual([['C4', 'E4', 'G4'], ['B3', 'E4', 'G4'], ['B3', 'D4', 'G4']])
  })
  it('derives inversion from the bass and preserves roles after rotation', () => {
    expect(results.map(r => r.voicing.inversion.name)).toEqual(['Root position', 'Second inversion', 'First inversion'])
    expect(results.map(r => r.voicing.bass.role)).toEqual(['root', 'fifth', 'third'])
    expect(results.map(r => r.voicing.soprano.role)).toEqual(['fifth', 'third', 'root'])
  })
})

describe('transposition and spelling', () => {
  it('transposes pitch classes in either direction with simple spellings', () => {
    expect(['C', 'F', 'G'].map(note => transposePitchClassName(note, 2))).toEqual(['D', 'G', 'A'])
    expect(['C', 'F', 'G'].map(note => transposePitchClassName(note, -1))).toEqual(['B', 'E', 'F#'])
    expect(() => transposePitchClassName('C', 1.5)).toThrow('integer')
  })

  it.each([
    ['D', 'A', ['D major', 'F# minor', 'A major'], [['D4', 'F#4', 'A4'], ['C#4', 'F#4', 'A4'], ['C#4', 'E4', 'A4']]],
    ['Eb', 'Bb', ['Eb major', 'G minor', 'Bb major'], [['Eb4', 'G4', 'Bb4'], ['D4', 'G4', 'Bb4'], ['D4', 'F4', 'Bb4']]],
    ['Gb', 'Db', ['Gb major', 'Bb minor', 'Db major'], [['Gb4', 'Bb4', 'Db5'], ['F4', 'Bb4', 'Db5'], ['F4', 'Ab4', 'Db5']]],
  ])('%s major with %s on top', (key, top, names, pitches) => {
    const results = explore(key, top)
    expect(results.map(r => r.triad.chordName)).toEqual(names)
    expect(results.map(r => r.voicing.notes.map(n => n.pitch.scientific))).toEqual(pitches)
    expect(results.map(r => r.voicing.inversion.index)).toEqual([0, 2, 1])
  })
  it.each([
    ['F#', ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#']],
    ['Gb', ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F']],
    ['C#', ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#']],
    ['Cb', ['Cb', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb']],
  ])('keeps correct %s scale and chord spelling', (tonic, expected) => {
    const scale = createScale({ tonic, mode: 'major' })
    expect(scale.notes.map(n => n.name)).toEqual(expected)
    expect(diatonicTriads(scale).flatMap(t => t.tones.map(n => n.pitchClass.name)).every(n => expected.includes(n))).toBe(true)
  })
  it('handles enharmonic octave boundaries without relabeling notes', () => {
    expect(pitchAtMidi(pitchClass('B#'), 60).scientific).toBe('B#3')
    expect(pitchAtMidi(pitchClass('Cb'), 59).scientific).toBe('Cb4')
    expect(sopranoPitch('B#').scientific).toBe('B#4')
    expect(sopranoPitch('Cb').scientific).toBe('Cb5')
  })
})

describe.each(MAJOR_KEYS)('$tonic major: all seven soprano choices', key => {
  const scale = createScale(key)
  const triads = diatonicTriads(scale)
  // Independent expected memberships by scale degree, rather than copying the filter.
  const expectedDegrees = [[1, 4, 6], [2, 5, 7], [1, 3, 6], [2, 4, 7], [1, 3, 5], [2, 4, 6], [3, 5, 7]]
  it('generates the expected major-scale quality and numeral pattern', () => {
    expect(triads.map(t => t.romanNumeral)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'])
    expect(triads.map(t => t.quality)).toEqual(['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'])
  })
  for (let index = 0; index < 7; index++) {
    it(`harmonizes degree ${index + 1} with three complete close-position voicings`, () => {
      const top = scale.notes[index]
      const results = harmonizeTopNote(triads, top.name)
      expect(results.map(r => r.triad.scaleDegree)).toEqual(expectedDegrees[index])
      expect(new Set(results.map(r => r.voicing.soprano.pitch.midi)).size).toBe(1)
      for (const { triad, voicing } of results) {
        const midi = voicing.notes.map(n => n.pitch.midi)
        expect(midi[0]).toBeLessThan(midi[1])
        expect(midi[1]).toBeLessThan(midi[2])
        expect(midi[2] - midi[0]).toBeLessThan(12)
        expect(voicing.soprano.pitch.name).toBe(top.name)
        expect(new Set(voicing.notes.map(n => n.pitch.name))).toEqual(new Set(triad.tones.map(t => t.pitchClass.name)))
        expect(voicing.bass.role).toBe(['root', 'third', 'fifth'][voicing.inversion.index])
        expect(voicing.notes.every(n => Number.isFinite(n.pitch.frequency))).toBe(true)
      }
    })
  }
})

describe('fretboard domain mapping', () => {
  it('finds every occurrence including open strings and octave repeats', () => {
    const board = createFretboard(explore('C', 'G')[0].triad.tones)
    expect(board.positions.filter(p => p.string === 1).map(p => [p.fret, p.tone.pitchClass.name, p.tone.role]))
      .toEqual([[0, 'E', 'third'], [3, 'G', 'fifth'], [8, 'C', 'root'], [12, 'E', 'third'], [15, 'G', 'fifth']])
    for (let string = 1; string <= 6; string++) {
      for (let fret = 0; fret <= 15; fret++) {
        const expected = [0, 4, 7].includes((board.tuning[6 - string].midi + fret) % 12)
        expect(board.positions.some(p => p.string === string && p.fret === fret)).toBe(expected)
      }
    }
  })
  it('labels enharmonic frets using the chord spelling', () => {
    const board = createFretboard(explore('Gb', 'Db')[0].triad.tones)
    expect(new Set(board.positions.map(p => p.tone.pitchClass.name))).toEqual(new Set(['Gb', 'Bb', 'Db']))
  })

  describe('scale top-note anchors', () => {
    it('maps every C-major scale occurrence on a string with its degree and spelling', () => {
      const board = createScaleFretboard(createScale({ tonic: 'C', mode: 'major' }))

      expect(board.positions.filter(position => position.string === 1).map(position => [position.fret, position.degree, position.pitchClass.name]))
        .toEqual([
          [0, 3, 'E'], [1, 4, 'F'], [3, 5, 'G'], [5, 6, 'A'], [7, 7, 'B'],
          [8, 1, 'C'], [10, 2, 'D'], [12, 3, 'E'], [13, 4, 'F'], [15, 5, 'G'],
        ])
    })

    it('maps every anchor to the chroma at its physical coordinate', () => {
      const board = createScaleFretboard(createScale({ tonic: 'D', mode: 'major' }))

      expect(board.positions.every(position => {
        const open = board.tuning[board.tuning.length - position.string]
        return position.pitchClass.chroma === (open.midi + position.fret) % 12
      })).toBe(true)
    })

    it('preserves flat-key spelling for enharmonic fret positions', () => {
      const board = createScaleFretboard(createScale({ tonic: 'Cb', mode: 'major' }))
      const openB = board.positions.find(position => position.string === 2 && position.fret === 0)
      const openHighE = board.positions.find(position => position.string === 1 && position.fret === 0)

      expect([openB?.degree, openB?.pitchClass.name]).toEqual([1, 'Cb'])
      expect([openHighE?.degree, openHighE?.pitchClass.name]).toEqual([4, 'Fb'])
    })

    it('honors custom tuning and fret range without encoding string visibility', () => {
      const tuning = [pitch('D3'), pitch('A3'), pitch('D4')]
      const board = createScaleFretboard(createScale({ tonic: 'C', mode: 'major' }), tuning, 2)

      expect(board.tuning).toBe(tuning)
      expect(board.fretCount).toBe(2)
      expect(board.positions.map(position => [position.string, position.fret, position.pitchClass.name]))
        .toEqual([[1, 0, 'D'], [1, 2, 'E'], [2, 0, 'A'], [2, 2, 'B'], [3, 0, 'D'], [3, 2, 'E']])
    })
  })

  describe('progression inversion shapes', () => {
    const cMajorProgression = createProgression(createScale({ tonic: 'C', mode: 'major' }), DEFAULT_PROGRESSION_DEGREES)

    it('places one compact three-note shape per selected inversion', () => {
      const board = createProgressionVoicingFretboard(cMajorProgression, [1, 2, 3])

      expect(board.shapes.map(shape => shape.notes.map(note => note.fret))).toEqual([
        [8, 8, 9], [10, 10, 10], [12, 12, 12], [13, 13, 14], [3, 3, 4], [5, 5, 5], [7, 6, 7],
      ])
      expect(board.shapes.every(shape => shape.notes.length === 3)).toBe(true)
    })

    it('continues the ascending staff register when a 22-fret neck can hold it', () => {
      const board = createProgressionVoicingFretboard(cMajorProgression, [1, 2, 3], undefined, 22)

      expect(board.fretCount).toBe(22)
      expect(board.shapes.map(shape => shape.notes.map(note => note.fret))).toEqual([
        [8, 8, 9], [10, 10, 10], [12, 12, 12], [13, 13, 14], [15, 15, 16], [17, 17, 17], [19, 18, 19],
      ])
    })

    it('repeats complete inversion shapes toward the nut and the end of a 22-fret neck', () => {
      const board = createProgressionVoicingFretboard(cMajorProgression, [1, 2, 3], undefined, 22, true)

      expect(board.shapes.map(shape => [shape.stepIndex + 1, shape.notes[0].fret])).toEqual([
        [3, 0], [4, 1], [5, 3], [6, 5], [7, 7], [1, 8], [2, 10],
        [3, 12], [4, 13], [5, 15], [6, 17], [7, 19], [1, 20], [2, 22],
      ])
      expect(board.shapes.every(shape => shape.notes.every(note => note.fret >= 0 && note.fret <= 22))).toBe(true)
    })

    it('preserves each inversion from soprano on the highest string to bass on the lowest', () => {
      const board = createProgressionVoicingFretboard(cMajorProgression, [1, 2, 3])

      board.shapes.forEach((shape, stepIndex) => {
        const expected = [...cMajorProgression.steps[stepIndex].voicing.notes].reverse()
        expect(shape.notes.map(note => note.string)).toEqual([1, 2, 3])
        expect(shape.notes.map(note => note.tone.role)).toEqual(expected.map(note => note.role))
        expect(shape.notes.map(note => note.tone.pitch.chroma)).toEqual(expected.map(note => note.pitch.chroma))
        expect(shape.notes.map(note => note.isTopNote)).toEqual([true, false, false])
      })
    })

    it.each([[1, 2, 3], [2, 3, 4], [3, 4, 5], [4, 5, 6]])('builds playable shapes on strings %s', (...strings) => {
      const board = createProgressionVoicingFretboard(cMajorProgression, strings)

      expect(board.shapes).toHaveLength(7)
      board.shapes.forEach(shape => {
        const soundingMidi = shape.notes.map(note => board.tuning[board.tuning.length - note.string].midi + note.fret)
        expect(soundingMidi[0]).toBeGreaterThan(soundingMidi[1])
        expect(soundingMidi[1]).toBeGreaterThan(soundingMidi[2])
        expect(Math.max(...shape.notes.map(note => note.fret)) - Math.min(...shape.notes.map(note => note.fret))).toBeLessThanOrEqual(5)
      })
    })

    it.each(MAJOR_KEYS)('maps all $tonic-major inversions across every three-string window', key => {
      const progression = createProgression(createScale(key), DEFAULT_PROGRESSION_DEGREES)

      for (const strings of [[1, 2, 3], [2, 3, 4], [3, 4, 5], [4, 5, 6]]) {
        const board = createProgressionVoicingFretboard(progression, strings)
        expect(board.shapes).toHaveLength(7)
        expect(board.shapes.every(shape => shape.notes.every(note => {
          const open = board.tuning[board.tuning.length - note.string]
          return (open.midi + note.fret) % 12 === note.tone.pitch.chroma && note.degree >= 1 && note.degree <= 7
        }))).toBe(true)
      }
    })

    it('requires exactly three distinct valid strings', () => {
      expect(() => createProgressionVoicingFretboard(cMajorProgression, [1, 2])).toThrow('exactly three strings')
      expect(() => createProgressionVoicingFretboard(cMajorProgression, [1, 1, 2])).toThrow('exactly three strings')
    })
  })
})

describe('pentatonic scales', () => {
  it.each(['major', 'minor'] as const)('retains the %s pentatonic feature ID and name', type => {
    expect(createPentatonicScale('C', type)).toMatchObject({ tonic: 'C', type, name: `C ${type} pentatonic` })
  })

  it('maps all and only matching positions over a configurable fret count', () => {
    const tuning = [pitch('C3'), pitch('E3')]
    const board = createPentatonicScaleFretboard(createPentatonicScale('C', 'minor'), tuning, 5)

    expect(board.tuning).toBe(tuning)
    expect(board.fretCount).toBe(5)
    expect(board.positions.map(position => [position.string, position.fret, position.tone.pitchClass.name, position.tone.label]))
      .toEqual([
        [1, 1, 'F', '4'], [1, 3, 'G', '5'],
        [2, 0, 'C', '1'], [2, 3, 'Eb', 'b3'], [2, 5, 'F', '4'],
      ])
    expect(board.positions.every(position => {
      const open = board.tuning[board.tuning.length - position.string]
      return position.tone.pitchClass.chroma === (open.midi + position.fret) % 12
    })).toBe(true)
  })

  it('rejects an invalid tonic', () => {
    expect(() => createPentatonicScale('H', 'major')).toThrow('Unsupported scale')
  })

  it.each([
    ['major', ['C4', 'D4', 'E4', 'G4', 'A4', 'C5']],
    ['minor', ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5']],
  ] as const)('places the C %s pentatonic across one ascending octave', (type, expected) => {
    expect(ascendingPentatonicPitches(createPentatonicScale('C', type)).map(note => note.scientific))
      .toEqual(expected)
  })

  it('keeps the repeated tonic spelling across an enharmonic octave boundary', () => {
    expect(ascendingPentatonicPitches(createPentatonicScale('Cb', 'major')).map(note => note.scientific))
      .toEqual(['Cb4', 'Db4', 'Eb4', 'Gb4', 'Ab4', 'Cb5'])
  })
})

describe('seven-step harmonized progressions', () => {
  const cMajor = createScale({ tonic: 'C', mode: 'major' })

  it('places every scale note in one continuously ascending soprano register', () => {
    expect(ascendingScaleSopranos(cMajor).map(note => note.scientific))
      .toEqual(['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5'])
  })

  it('offers the diatonic root-on-top chord first, then fifth-on-top and third-on-top', () => {
    expect(cMajor.notes.map((_, index) => harmonizationChoices(cMajor, (index + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7).map(result => result.triad.scaleDegree)))
      .toEqual([[1, 4, 6], [2, 5, 7], [3, 6, 1], [4, 7, 2], [5, 1, 3], [6, 2, 4], [7, 3, 5]])

    expect(cMajor.notes.map((note, index) => harmonizationChoices(cMajor, (index + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7).map(result => (
      result.triad.tones.find(tone => tone.pitchClass.chroma === note.chroma)?.role
    )))).toEqual(Array.from({ length: 7 }, () => ['root', 'fifth', 'third']))
  })

  it('builds an ordered progression with one complete voicing per top note', () => {
    const progression = createProgression(cMajor, DEFAULT_PROGRESSION_DEGREES)
    expect(progression.steps.map(step => step.triad.romanNumeral)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'])
    expect(progression.steps.map(step => step.voicing.soprano.pitch.scientific))
      .toEqual(['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5'])
    expect(progression.steps.map(step => step.voicing.notes.map(note => note.pitch.scientific)))
      .toEqual([
        ['E4', 'G4', 'C5'], ['F4', 'A4', 'D5'], ['G4', 'B4', 'E5'], ['A4', 'C5', 'F5'],
        ['B4', 'D5', 'G5'], ['C5', 'E5', 'A5'], ['D5', 'F5', 'B5'],
      ])
  })

  it('rejects a chord that does not contain its assigned top note', () => {
    const invalid: ProgressionChordDegrees = [2, 2, 3, 4, 5, 6, 7]
    expect(() => createProgression(cMajor, invalid)).toThrow('Scale degree 2 cannot harmonize scale degree 1 (C)')
  })

  it('preserves spelling when the same selections are transposed', () => {
    const cb = createProgression(createScale({ tonic: 'Cb', mode: 'major' }), DEFAULT_PROGRESSION_DEGREES)
    expect(cb.steps.map(step => step.voicing.soprano.pitch.scientific))
      .toEqual(['Cb5', 'Db5', 'Eb5', 'Fb5', 'Gb5', 'Ab5', 'Bb5'])
  })

  describe('grouped progression fretboard', () => {
    it('groups shared C at fifth string, third fret while preserving each occurrence and role', () => {
      const board = createProgressionFretboard(createProgression(cMajor, DEFAULT_PROGRESSION_DEGREES))
      const position = board.positions.find(candidate => candidate.string === 5 && candidate.fret === 3)

      expect(position?.markers.map(marker => [marker.stepIndex, marker.tone.pitchClass.name, marker.tone.role]))
        .toEqual([[0, 'C', 'root'], [3, 'C', 'fifth'], [5, 'C', 'third']])
    })

    it('retains separate step identities when the same chord is selected repeatedly', () => {
      const repeatedI: ProgressionChordDegrees = [1, 2, 1, 4, 1, 6, 7]
      const board = createProgressionFretboard(createProgression(cMajor, repeatedI))
      const openHighE = board.positions.find(position => position.string === 1 && position.fret === 0)

      expect(openHighE?.markers.filter(marker => marker.triad.scaleDegree === 1).map(marker => marker.stepIndex))
        .toEqual([0, 2, 4])
    })

    it('maps every marker to the chroma at its physical string and fret', () => {
      const board = createProgressionFretboard(createProgression(cMajor, DEFAULT_PROGRESSION_DEGREES))

      for (const position of board.positions) {
        const chroma = (board.tuning[board.tuning.length - position.string].midi + position.fret) % 12
        expect(position.markers.every(marker => marker.tone.pitchClass.chroma === chroma)).toBe(true)
      }
    })

    it('returns unique coordinates with positions and markers in deterministic order', () => {
      const board = createProgressionFretboard(createProgression(cMajor, DEFAULT_PROGRESSION_DEGREES))
      const coordinates = board.positions.map(position => `${position.string}-${position.fret}`)

      expect(new Set(coordinates).size).toBe(coordinates.length)
      expect(board.positions).toEqual([...board.positions].sort((left, right) => left.string - right.string || left.fret - right.fret))
      expect(board.positions.every(position => position.markers.every((marker, index) => index === 0 || position.markers[index - 1].stepIndex < marker.stepIndex))).toBe(true)
    })

    it('uses the progression chord spelling for enharmonic fret markers', () => {
      const cb = createProgression(createScale({ tonic: 'Cb', mode: 'major' }), DEFAULT_PROGRESSION_DEGREES)
      const board = createProgressionFretboard(cb)
      const openB = board.positions.find(position => position.string === 2 && position.fret === 0)

      expect(openB?.markers.map(marker => marker.tone.pitchClass.name)).toEqual(['Cb', 'Cb', 'Cb'])
    })
  })
})

it('rejects invalid input instead of producing broken visualization data', () => {
  expect(() => createScale({ tonic: 'H', mode: 'major' })).toThrow()
  expect(() => pitch('C')).toThrow()
  expect(() => closePosition(explore('C', 'G')[0].triad, pitch('F#4'))).toThrow()
})
