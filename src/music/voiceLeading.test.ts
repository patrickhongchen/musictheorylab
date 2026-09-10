import { describe, expect, it } from 'vitest'
import { chordShapeFamilyId, groupChordShapeRepeats, soundingBass } from './chordShapes'
import { STANDARD_TUNING } from './fretboard'
import { createMajorSeventh, createMajorSeventhShapes } from './majorSeventhShapes'
import { createTriadShapesFromTemplates, TRIAD_SHAPE_TEMPLATES } from './triadShapeTemplates'
import { createTriad } from './triads'
import type { ChordQuality } from './types'
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

  it('routes closed triads to the canonical explicit template families', () => {
    const choice = createChordChoice('c-closed', 'C', 'major', 'closed')
    const actual = createPlayableShapesForChord(choice, { fretCount: 12 })

    expect(actual.map(shape => [shape.templateId, shape.notes.map(note => `${note.string}:${note.fret}`).join('|')])).toEqual([
      ['closed-123-second', '1:0|2:1|3:0'],
      ['closed-123-root', '1:3|2:5|3:5'],
      ['closed-123-first', '1:8|2:8|3:9'],
      ['closed-234-first', '2:1|3:0|4:2'],
      ['closed-234-second', '2:5|3:5|4:5'],
      ['closed-234-root', '2:8|3:9|4:10'],
      ['closed-345-root', '3:0|4:2|5:3'],
      ['closed-345-first', '3:5|4:5|5:7'],
      ['closed-345-second', '3:9|4:10|5:10'],
      ['closed-456-second', '4:2|5:3|6:3'],
      ['closed-456-root', '4:5|5:7|6:8'],
      ['closed-456-first', '4:10|5:10|6:12'],
    ])
  })

  it('routes spread triads to canonical explicit template families and repeats', () => {
    const choice = createChordChoice('f-spread', 'F', 'minor', 'spread')
    const actual = createPlayableShapesForChord(choice, { fretCount: 18 })

    expect(actual.map(shape => [shape.templateId, shape.notes.map(note => `${note.string}:${note.fret}`).join('|')])).toEqual([
      ['spread-356-root', '3:1|5:3|6:1'],
      ['spread-135-second', '1:1|3:1|5:3'],
      ['spread-134-root', '1:4|3:5|4:3'],
      ['spread-346-first', '3:5|4:3|6:4'],
      ['spread-245-root', '2:9|4:10|5:8'],
      ['spread-124-first', '1:8|2:6|4:6'],
      ['spread-246-second', '2:6|4:6|6:8'],
      ['spread-356-root', '3:13|5:15|6:13'],
      ['spread-235-first', '2:13|3:10|5:11'],
      ['spread-135-second', '1:13|3:13|5:15'],
      ['spread-134-second', '1:13|3:13|4:10'],
      ['spread-134-root', '1:16|3:17|4:15'],
      ['spread-346-first', '3:17|4:15|6:16'],
    ])
  })

  it('combines all existing Major 7 families without changing their shapes', () => {
    const existing = createMajorSeventhShapes(createMajorSeventh('C'), { fretCount: 22 })
    const actual = createPlayableShapesForChord(createChordChoice('cmaj7', 'C', 'major7'))

    expect(actual.map(shape => shape.id)).toEqual(existing.map(shape => shape.id))
    expect(actual.map(shape => shape.templateId)).toEqual(existing.map(shape => shape.templateId))
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

const roots = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const
const fretCounts = [22, 35] as const
const qualities: readonly ChordQuality[] = ['major', 'minor', 'diminished', 'augmented']
describe('explicit triad shape templates', () => {
  it('defines quality-specific closed and spread geometry with stable identities', () => {
    const expectedCounts = {
      major: { closed: 12, spread: 9 },
      minor: { closed: 12, spread: 9 },
      diminished: { closed: 12, spread: 8 },
      augmented: { closed: 12, spread: 8 },
    } as const

    for (const quality of qualities) {
      for (const voicing of ['closed', 'spread'] as const) {
        const templates = TRIAD_SHAPE_TEMPLATES.filter(template => (
          template.quality === quality && template.voicing === voicing
        ))
        expect(templates).toHaveLength(expectedCounts[quality][voicing])
        expect(new Set(templates.map(template => template.id)).size).toBe(templates.length)
        expect(templates.every(template => template.notes.length === 3)).toBe(true)
        expect(templates.every(template => (
          [...template.notes.map(note => note.role)].sort().join(',') === 'fifth,root,third'
        ))).toBe(true)
      }
    }
  })

  it.each(qualities)('transposes %s templates directly with valid metadata and geometry', quality => {
    for (const root of roots) {
      for (const fretCount of fretCounts) {
        const triad = createTriad(root, quality)
        for (const voicing of ['closed', 'spread'] as const) {
          const templates = TRIAD_SHAPE_TEMPLATES.filter(template => (
            template.quality === quality && template.voicing === voicing
          ))
          const shapes = createTriadShapesFromTemplates(triad, voicing, { fretCount })
          expect(shapes.length).toBeGreaterThan(0)
          for (const shape of shapes) {
            const template = templates.find(candidate => candidate.id === shape.templateId)
            expect(template).toBeDefined()
            expect(shape.cagedForms).toEqual([template!.cagedForm])
            expect(shape.notes).toHaveLength(3)
            expect(shape.notes.every(note => note.fret >= 0 && note.fret <= fretCount)).toBe(true)
            expect(shape.notes.every(note => (
              (STANDARD_TUNING[STANDARD_TUNING.length - note.string].midi + note.fret) % 12
              === note.tone.pitchClass.chroma
            ))).toBe(true)
            expect(shape.inversion.index).toBe({ root: 0, third: 1, fifth: 2, seventh: 3 }[soundingBass(shape).tone.role])
          }
        }
      }
    }
  })

  it('uses template identity for stable octave-repeat families', () => {
    const shapes = createTriadShapesFromTemplates(createTriad('C', 'major'), 'closed', { fretCount: 35 })
    const groups = groupChordShapeRepeats(shapes)

    expect(groups.every(group => new Set(group.map(shape => shape.templateId)).size === 1)).toBe(true)
    expect(groups.every(group => new Set(group.map(chordShapeFamilyId)).size === 1)).toBe(true)
    expect(groups.some(group => group.length > 1)).toBe(true)
  })
})
