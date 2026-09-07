import { describe, expect, it } from 'vitest'
import { pitch } from './pitches'
import {
  CHORD_QUALITY_LABELS,
  NOTE_ROOTS,
  SCALE_TYPE_LABELS,
  SEED_SOLOING_PROGRESSION,
  SOLOING_CHORD_QUALITIES,
  SOLOING_SCALE_TYPES,
  ascendingSoloingScalePitches,
  createSeedSoloingProgression,
  createSoloingChord,
  createSoloingFretboard,
  createSoloingScale,
  createSoloingStaffModel,
  createSoloingStep,
  createSoloingStepId,
  getNextSoloingStep,
  type SoloingChordQuality,
  type SoloingScaleType,
} from './soloing'

describe('soloing chord-scale domain', () => {
  it.each<[SoloingChordQuality, string, readonly string[], readonly string[]]>([
    ['major', 'C', ['C', 'E', 'G'], ['1', '3', '5']],
    ['minor', 'Cm', ['C', 'Eb', 'G'], ['1', 'b3', '5']],
    ['diminished', 'Cdim', ['C', 'Eb', 'Gb'], ['1', 'b3', 'b5']],
    ['major7', 'Cmaj7', ['C', 'E', 'G', 'B'], ['1', '3', '5', '7']],
    ['minor7', 'Cm7', ['C', 'Eb', 'G', 'Bb'], ['1', 'b3', '5', 'b7']],
    ['dominant7', 'C7', ['C', 'E', 'G', 'Bb'], ['1', '3', '5', 'b7']],
  ])('creates a %s chord', (quality, name, notes, labels) => {
    const chord = createSoloingChord('C', quality)
    expect(chord.name).toBe(name)
    expect(chord.tones.map(tone => tone.pitchClass.name)).toEqual(notes)
    expect(chord.tones.map(tone => tone.label)).toEqual(labels)
    expect(chord.tones.map(tone => tone.interval)).toHaveLength(notes.length)
  })

  it.each<[SoloingScaleType, readonly string[], readonly string[]]>([
    ['ionian', ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'], ['1', '2', '3', '4', '5', '6', '7']],
    ['dorian', ['A', 'B', 'C', 'D', 'E', 'F#', 'G'], ['1', '2', 'b3', '4', '5', '6', 'b7']],
    ['mixolydian', ['A', 'B', 'C#', 'D', 'E', 'F#', 'G'], ['1', '2', '3', '4', '5', '6', 'b7']],
    ['aeolian', ['A', 'B', 'C', 'D', 'E', 'F', 'G'], ['1', '2', 'b3', '4', '5', 'b6', 'b7']],
    ['majorPentatonic', ['A', 'B', 'C#', 'E', 'F#'], ['1', '2', '3', '5', '6']],
    ['minorPentatonic', ['A', 'C', 'D', 'E', 'G'], ['1', 'b3', '4', '5', 'b7']],
    ['blues', ['A', 'C', 'D', 'Eb', 'E', 'G'], ['1', 'b3', '4', 'b5', '5', 'b7']],
  ])('creates an A %s scale', (type, notes, labels) => {
    const scale = createSoloingScale('A', type)
    expect(scale.name).toBe(`A ${SCALE_TYPE_LABELS[type]}`)
    expect(scale.tones.map(tone => tone.pitchClass.name)).toEqual(notes)
    expect(scale.tones.map(tone => tone.label)).toEqual(labels)
    expect(scale.tones.every(tone => tone.interval.length > 0)).toBe(true)
  })

  it('exports complete, labeled editor options', () => {
    expect(NOTE_ROOTS).toHaveLength(12)
    expect(new Set(NOTE_ROOTS)).toHaveProperty('size', 12)
    expect(Object.keys(CHORD_QUALITY_LABELS)).toEqual(SOLOING_CHORD_QUALITIES)
    expect(Object.keys(SCALE_TYPE_LABELS)).toEqual(SOLOING_SCALE_TYPES)
  })

  it('keeps functional chord spelling while simplifying fretboard scale spellings', () => {
    expect(createSoloingChord('Bb', 'dominant7').tones.map(tone => tone.pitchClass.name))
      .toEqual(['Bb', 'D', 'F', 'Ab'])
    expect(createSoloingScale('Bb', 'blues').tones.map(tone => tone.pitchClass.name))
      .toEqual(['Bb', 'Db', 'Eb', 'E', 'F', 'Ab'])
    expect(createSoloingChord('C#', 'major7').tones.map(tone => tone.pitchClass.name))
      .toEqual(['C#', 'E#', 'G#', 'B#'])
    expect(createSoloingScale('Db', 'blues').tones.map(tone => tone.pitchClass.name))
      .toEqual(['Db', 'E', 'Gb', 'G', 'Ab', 'B'])
  })

  it('rejects invalid notes and unknown runtime options', () => {
    expect(() => createSoloingChord('H', 'major')).toThrow('Invalid note')
    expect(() => createSoloingScale('H', 'blues')).toThrow('Invalid note')
    expect(() => createSoloingChord('C', 'quartal' as SoloingChordQuality)).toThrow('Unsupported chord quality')
    expect(() => createSoloingScale('C', 'wholeTone' as SoloingScaleType)).toThrow('Unsupported scale type')
  })
})

describe('soloing progression', () => {
  it('provides the intended four-step starting progression with independent scale roots', () => {
    expect(SEED_SOLOING_PROGRESSION.map(step => [
      createSoloingChord(step.chord.root, step.chord.quality).name,
      createSoloingScale(step.scale.root, step.scale.type).name,
    ])).toEqual([
      ['A7', 'A Blues Scale'],
      ['D7', 'A Blues Scale'],
      ['A7', 'A Blues Scale'],
      ['E7', 'E Mixolydian'],
    ])
    expect(new Set(SEED_SOLOING_PROGRESSION.map(step => step.id)).size).toBe(4)
  })

  it('returns fresh editable copies of the seed progression', () => {
    const first = createSeedSoloingProgression()
    const second = createSeedSoloingProgression()
    expect(first).toEqual(second)
    expect(first).not.toBe(second)
    expect(first[0]).not.toBe(second[0])
    expect(first[0].chord).not.toBe(second[0].chord)
  })

  it('normalizes roots and creates unique stable step ids', () => {
    const ids = [createSoloingStepId(), createSoloingStepId()]
    expect(new Set(ids).size).toBe(2)
    expect(createSoloingStep({ root: 'db', quality: 'minor' }, { root: 'f#', type: 'dorian' }, 'chosen-id'))
      .toEqual({
        id: 'chosen-id',
        chord: { root: 'Db', quality: 'minor' },
        scale: { root: 'F#', type: 'dorian' },
      })
  })

  it('resolves the immediate next stable id, including duplicates and wraparound', () => {
    const progression = createSeedSoloingProgression()
    expect(getNextSoloingStep(progression, 'seed-a7-1')?.id).toBe('seed-d7')
    expect(getNextSoloingStep(progression, 'seed-a7-2')?.id).toBe('seed-e7')
    expect(getNextSoloingStep(progression, 'seed-e7')?.id).toBe('seed-a7-1')
    expect(getNextSoloingStep([progression[0]], progression[0].id)).toBeUndefined()
    expect(getNextSoloingStep(progression, 'missing')).toBeUndefined()
    expect(getNextSoloingStep([], 'missing')).toBeUndefined()
  })
})

describe('soloing visual models', () => {
  it('places variable-length scales from tonic to octave in ascending staff order', () => {
    expect(ascendingSoloingScalePitches(createSoloingScale('A', 'blues')).map(note => note.scientific))
      .toEqual(['A4', 'C5', 'D5', 'Eb5', 'E5', 'G5', 'A5'])
    expect(ascendingSoloingScalePitches(createSoloingScale('C', 'majorPentatonic')).map(note => note.scientific))
      .toEqual(['C4', 'D4', 'E4', 'G4', 'A4', 'C5'])
    expect(ascendingSoloingScalePitches(createSoloingScale('Bb', 'ionian')).map(note => note.scientific))
      .toEqual(['Bb4', 'C5', 'D5', 'Eb5', 'F5', 'G5', 'A5', 'Bb5'])
  })

  it('classifies scale, current, next, shared, and outside-scale staff tones', () => {
    const current = createSoloingStep(
      { root: 'A', quality: 'dominant7' },
      { root: 'A', type: 'blues' },
      'current',
    )
    const next = createSoloingStep(
      { root: 'D', quality: 'dominant7' },
      { root: 'D', type: 'mixolydian' },
      'next',
    )
    const model = createSoloingStaffModel(current, next)
    const a = model.scaleTones.find(tone => tone.pitch.scientific === 'A4')
    const d = model.scaleTones.find(tone => tone.pitch.scientific === 'D5')
    const cSharp = model.outsideChordTones.find(tone => tone.pitch.name === 'C#')
    const fSharp = model.outsideChordTones.find(tone => tone.pitch.name === 'F#')

    expect(model.currentChord.name).toBe('A7')
    expect(model.nextChord?.name).toBe('D7')
    expect(a).toMatchObject({ isScaleTone: true, isCurrentChordTone: true, isNextChordTone: true, isSharedChordTone: true })
    expect(d).toMatchObject({ isScaleTone: true, isCurrentChordTone: false, isNextChordTone: true, isSharedChordTone: false })
    expect(cSharp).toMatchObject({ isScaleTone: false, isCurrentChordTone: true, isNextChordTone: false, isOutsideScale: true })
    expect(fSharp).toMatchObject({ isScaleTone: false, isCurrentChordTone: false, isNextChordTone: true, isOutsideScale: true })
  })

  it('maps classified membership to physical standard-tuning coordinates from fret 0 through 22', () => {
    const [current, next] = createSeedSoloingProgression()
    const board = createSoloingFretboard(current, next)
    expect([board.fretStart, board.fretEnd]).toEqual([0, 22])
    expect(board.positions.some(position => position.fret === 0)).toBe(true)
    expect(board.positions.some(position => position.fret === 22)).toBe(true)
    expect(board.positions).toEqual([...board.positions].sort((left, right) => left.string - right.string || left.fret - right.fret))
    expect(board.positions.every(position => {
      const open = board.tuning[board.tuning.length - position.string]
      return position.pitchClass.chroma === (open.midi + position.fret) % 12
    })).toBe(true)

    const lowFSharp = board.positions.find(position => position.string === 6 && position.fret === 2)
    expect(lowFSharp).toMatchObject({
      pitchClass: { name: 'F#' },
      isScaleTone: false,
      isCurrentChordTone: false,
      isNextChordTone: true,
      isOutsideScale: true,
    })
    const highA = board.positions.find(position => position.string === 1 && position.fret === 5)
    expect(highA).toMatchObject({
      isScaleTone: true,
      isCurrentChordTone: true,
      isNextChordTone: true,
      isSharedChordTone: true,
    })
  })

  it('supports alternate tunings and inclusive subranges', () => {
    const current = SEED_SOLOING_PROGRESSION[0]
    const board = createSoloingFretboard(current, undefined, 2, 4, [pitch('D3')])
    expect(board.tuning.map(note => note.scientific)).toEqual(['D3'])
    expect(board.positions.map(position => [position.string, position.fret, position.pitchClass.name]))
      .toEqual([[1, 2, 'E']])
    expect(() => createSoloingFretboard(current, undefined, -1, 22)).toThrow('valid ascending fret range')
    expect(() => createSoloingFretboard(current, undefined, 8, 7)).toThrow('valid ascending fret range')
    expect(() => createSoloingFretboard(current, undefined, 1.5, 7)).toThrow('valid ascending fret range')
  })
})
