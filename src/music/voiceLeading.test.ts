import { describe, expect, it } from 'vitest'
import { soundingBass } from './chordShapes'
import { createMajorSeventh, createMajorSeventhShapes } from './majorSeventhShapes'
import { createSpreadTriadShapes } from './spreadTriadShapes'
import { createTriadShapesOnStrings } from './triadShapes'
import { createTriad } from './triads'
import {
  collectAvailableInversions,
  createChordChoice,
  createPlayableShapesForChord,
  filterShapesByLowestString,
  LOWEST_STRING_OPTIONS,
  updateChordChoice,
  updateChordChoiceAt,
  VOICE_LEADING_QUALITIES,
  voicingOptionsForQuality,
} from './voiceLeading'

describe('Voice Leading chord choices', () => {
  it('offers quality-specific voicings with centralized defaults', () => {
    expect(VOICE_LEADING_QUALITIES).toEqual(['major', 'minor', 'diminished', 'major7'])
    expect(voicingOptionsForQuality('major').map(option => [option.value, option.label])).toEqual([
      ['closed', 'Closed'], ['spread', 'Spread'],
    ])
    expect(voicingOptionsForQuality('major7').map(option => [option.value, option.label])).toEqual([
      ['major7', 'Major 7 voicings'],
    ])
    expect(createChordChoice('triad', 'C', 'minor').voicing).toBe('closed')
    expect(createChordChoice('seventh', 'C', 'major7').voicing).toBe('major7')
  })

  it('normalizes invalid voicings when quality changes while retaining stable slot identity', () => {
    const spread = createChordChoice('slot-a', 'C', 'major', 'spread')
    const majorSeventh = updateChordChoice(spread, { quality: 'major7' })
    expect(majorSeventh).toEqual({ id: 'slot-a', root: 'C', quality: 'major7', voicing: 'major7' })
    expect(updateChordChoice(majorSeventh, { quality: 'major' })).toEqual({
      id: 'slot-a', root: 'C', quality: 'major', voicing: 'closed',
    })
  })

  it('updates one repeated theoretical chord without changing another slot', () => {
    const choices = [
      createChordChoice('opening-c', 'C', 'major'),
      createChordChoice('closing-c', 'C', 'major'),
      createChordChoice('major-seven', 'G', 'major7'),
    ]
    const updated = updateChordChoiceAt(choices, 'closing-c', { voicing: 'spread' })

    expect(updated.map(choice => [choice.id, choice.voicing])).toEqual([
      ['opening-c', 'closed'], ['closing-c', 'spread'], ['major-seven', 'major7'],
    ])
    expect(updated[0]).toBe(choices[0])
    expect(updated[2]).toBe(choices[2])
  })
})

describe('Voice Leading shape routing and filtering', () => {
  it('keeps Lowest String options fixed and independent of chord quality', () => {
    expect(LOWEST_STRING_OPTIONS).toEqual([
      { value: 0, label: 'All' },
      { value: 6, label: 'Low E' },
      { value: 5, label: 'A' },
      { value: 4, label: 'D' },
      { value: 3, label: 'G' },
    ])
  })

  it('uses every existing adjacent-string closed-triad shape unchanged', () => {
    const choice = createChordChoice('c-closed', 'C', 'major', 'closed')
    const actual = createPlayableShapesForChord(choice, { fretCount: 12 })
    const triad = createTriad('C', 'major')
    const existing = [[1, 2, 3], [2, 3, 4], [3, 4, 5], [4, 5, 6]]
      .flatMap(strings => createTriadShapesOnStrings(triad, strings, undefined, 12))

    expect(actual.map(shape => shape.id)).toEqual(existing.map(shape => shape.id))
    expect(actual.map(shape => shape.notes)).toEqual(existing.map(shape => shape.notes))
  })

  it('uses the existing spread-triad generator unchanged', () => {
    const choice = createChordChoice('f-spread', 'F', 'minor', 'spread')
    const actual = createPlayableShapesForChord(choice, { fretCount: 18 })
    const existing = createSpreadTriadShapes(createTriad('F', 'minor'), { fretCount: 18 })

    expect(actual.map(shape => shape.id)).toEqual(existing.map(shape => shape.id))
    expect(actual.map(shape => shape.notes)).toEqual(existing.map(shape => shape.notes))
  })

  it('combines all existing Major 7 families without changing their shapes', () => {
    const existing = createMajorSeventhShapes(createMajorSeventh('C'), { fretCount: 22 })
    const actual = createPlayableShapesForChord(createChordChoice('cmaj7', 'C', 'major7'))

    expect(actual.map(shape => shape.id)).toEqual(existing.map(shape => shape.id))
    expect(actual.map(shape => shape.layout)).toEqual(existing.map(shape => shape.layout))
  })

  it('applies lowest-string filtering after generation and permits a zero-result G filter', () => {
    const triads = createPlayableShapesForChord(createChordChoice('c-closed', 'C', 'major', 'closed'))
    const gBassTriads = filterShapesByLowestString(triads, 3)
    expect(gBassTriads.length).toBeGreaterThan(0)
    expect(gBassTriads.length).toBeLessThan(triads.length)
    expect(gBassTriads.every(shape => soundingBass(shape).string === 3)).toBe(true)
    expect(filterShapesByLowestString(triads, 0)).toBe(triads)

    const majorSevenths = createPlayableShapesForChord(createChordChoice('cmaj7', 'C', 'major7'))
    expect(majorSevenths.length).toBeGreaterThan(0)
    expect(filterShapesByLowestString(majorSevenths, 3)).toEqual([])
  })

  it('derives mixed inversion columns while excluding triads from third inversion', () => {
    const triads = createPlayableShapesForChord(createChordChoice('c', 'C', 'major', 'spread'))
    const majorSevenths = createPlayableShapesForChord(createChordChoice('gmaj7', 'G', 'major7'))
    const inversions = collectAvailableInversions([triads, majorSevenths])

    expect(inversions.map(inversion => [inversion.index, inversion.name])).toEqual([
      [0, 'Root position'], [1, 'First inversion'], [2, 'Second inversion'], [3, 'Third inversion'],
    ])
    expect(triads.some(shape => shape.inversion.index === 3)).toBe(false)
    expect(majorSevenths.some(shape => shape.inversion.index === 3)).toBe(true)
  })
})
