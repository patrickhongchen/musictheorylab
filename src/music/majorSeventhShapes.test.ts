import { describe, expect, it } from 'vitest'
import { chordShapeFamilyId, fromTriadShape, groupChordShapeRepeats, soundingBass } from './chordShapes'
import { STANDARD_TUNING } from './fretboard'
import { createMajorSeventh, createMajorSeventhShapes, MAJOR_SEVENTH_SHAPE_TEMPLATES } from './majorSeventhShapes'
import { createTriadShapesOnStrings, triadShapeFamilyId } from './triadShapes'
import { createTriad } from './triads'

const physicalKey = (shape: { readonly notes: readonly { readonly string: number; readonly fret: number }[] }) => (
  shape.notes.map(note => `${note.string}:${note.fret}`).join('|')
)
const midi = (note: { readonly string: number; readonly fret: number }) => (
  STANDARD_TUNING[STANDARD_TUNING.length - note.string].midi + note.fret
)

describe('Major 7 chords and curated guitar shapes', () => {
  it('builds a correctly spelled root, major third, fifth, and major seventh', () => {
    const chord = createMajorSeventh('C')
    expect(chord.quality).toBe('major7')
    expect(chord.tones.map(tone => [tone.role, tone.pitchClass.name, tone.interval])).toEqual([
      ['root', 'C', '1P'], ['third', 'E', '3M'], ['fifth', 'G', '5P'], ['seventh', 'B', '7M'],
    ])
  })

  it('transposes a template while retaining its strings, offsets, and roles', () => {
    const c = createMajorSeventhShapes(createMajorSeventh('C'))
      .find(shape => shape.templateId === 'e-root-r735' && shape.rootAnchor?.fret === 8)!
    const d = createMajorSeventhShapes(createMajorSeventh('D'))
      .find(shape => shape.templateId === 'e-root-r735' && shape.rootAnchor?.fret === 10)!

    expect(d.notes.map(note => [note.string, note.fret - d.rootAnchor!.fret, note.tone.role]))
      .toEqual(c.notes.map(note => [note.string, note.fret - c.rootAnchor!.fret, note.tone.role]))
    expect(d.notes.map(note => note.fret)).toEqual(c.notes.map(note => note.fret + 2))
    expect(d.notes.map(note => note.tone.pitchClass.name)).toEqual(['A', 'F#', 'C#', 'D'])
  })

  it('classifies R-7-3-5 from the actual sounding bass and retains the skipped string', () => {
    const shape = createMajorSeventhShapes(createMajorSeventh('C'))
      .find(candidate => candidate.templateId === 'e-root-r735' && candidate.rootAnchor?.fret === 8)!
    const bassToTop = [...shape.notes].sort((left, right) => midi(left) - midi(right))

    expect(bassToTop.map(note => note.tone.role)).toEqual(['root', 'seventh', 'third', 'fifth'])
    expect(shape.inversion).toMatchObject({ index: 0, name: 'Root position' })
    expect(soundingBass(shape).tone.role).toBe('root')
    expect(soundingBass({ ...shape, notes: [...shape.notes].reverse() }).tone.role).toBe('root')
    expect(shape.notes.map(note => note.string).sort()).toEqual([2, 3, 4, 6])
    expect(shape.mutedStrings).toEqual([1, 5])
  })

  it('provides all four inversions and derives each from its lowest MIDI note', () => {
    const shapes = createMajorSeventhShapes(createMajorSeventh('C'))
      .filter(shape => shape.templateId?.startsWith('drop2-top4-') && Math.max(...shape.notes.map(note => note.fret)) < 13)
    expect(new Set(shapes.map(shape => shape.inversion.index))).toEqual(new Set([0, 1, 2, 3]))
    for (const shape of shapes) {
      expect(shape.inversion.index).toBe({ root: 0, third: 1, fifth: 2, seventh: 3 }[soundingBass(shape).tone.role])
      expect(shape.notes.map(note => note.tone.role).sort()).toEqual(['fifth', 'root', 'seventh', 'third'])
    }
  })

  it('uses twelve complete templates and never emits duplicate physical shapes', () => {
    expect(MAJOR_SEVENTH_SHAPE_TEMPLATES).toHaveLength(12)
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']) {
      const shapes = createMajorSeventhShapes(createMajorSeventh(root), { fretCount: 24 })
      expect(new Set(shapes.map(physicalKey)).size).toBe(shapes.length)
      expect(shapes.every(shape => shape.notes.length === 4 && new Set(shape.notes.map(note => note.tone.role)).size === 4)).toBe(true)
      expect(shapes.every(shape => shape.notes.every(note => midi(note) % 12 === note.tone.pitchClass.chroma))).toBe(true)
    }
  })

  it('provides four inversion families on each of the three reference string groups in every key', () => {
    const drop2 = ['root,fifth,seventh,third', 'third,seventh,root,fifth', 'fifth,root,third,seventh', 'seventh,third,fifth,root']
    const skipped = ['root,seventh,third,fifth', 'third,root,fifth,seventh', 'fifth,third,seventh,root', 'seventh,fifth,root,third']
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']) {
      const shapes = createMajorSeventhShapes(createMajorSeventh(root))
      for (const [strings, orders] of [['1,2,3,4', drop2], ['2,3,4,5', drop2], ['2,3,4,6', skipped]] as const) {
        const groups = groupChordShapeRepeats(shapes.filter(shape => shape.notes.map(note => note.string).join(',') === strings))
        expect(groups).toHaveLength(4)
        expect(groups.map(group => group[0].inversion.index).sort()).toEqual([0, 1, 2, 3])
        for (const group of groups) {
          for (const shape of group) {
            const bassToTop = [...shape.notes].sort((a, b) => midi(a) - midi(b))
            expect(bassToTop.map(note => note.tone.role).join(',')).toBe(orders[shape.inversion.index])
            expect(shape.notes.every(note => !shape.mutedStrings!.includes(note.string))).toBe(true)
          }
        }
      }
    }
  })

  it('keeps IDs and family IDs stable and groups octave repeats', () => {
    const first = createMajorSeventhShapes(createMajorSeventh('C'), { fretCount: 24 })
    const second = createMajorSeventhShapes(createMajorSeventh('C'), { fretCount: 24 })
    expect(second.map(shape => shape.id)).toEqual(first.map(shape => shape.id))

    const repeats = groupChordShapeRepeats(first)
      .find(group => group[0].templateId === 'e-root-r735')!
    expect(repeats.map(shape => shape.rootAnchor?.fret)).toEqual([8, 20])
    expect(new Set(repeats.map(chordShapeFamilyId)).size).toBe(1)
  })

  it('adapts and groups triads alongside Major 7 shapes without changing triad identity', () => {
    const triadShapes = createTriadShapesOnStrings(createTriad('G', 'major'), [1, 2, 3], undefined, 12)
    const adapted = triadShapes.map(fromTriadShape)
    expect(adapted.map(shape => shape.id)).toEqual(triadShapes.map(shape => shape.id))
    expect(adapted.map(chordShapeFamilyId)).toEqual(triadShapes.map(triadShapeFamilyId))

    const majorSevenths = createMajorSeventhShapes(createMajorSeventh('C'), { fretCount: 12 })
    const mixed = [...adapted, ...majorSevenths]
    const grouped = groupChordShapeRepeats(mixed)
    expect(grouped.flat()).toHaveLength(mixed.length)
    expect(grouped.flat().some(shape => shape.chord.quality === 'major7')).toBe(true)
    expect(grouped.flat().some(shape => shape.chord.quality === 'major')).toBe(true)
  })

  it('clips shapes to the fretboard and validates the fret count', () => {
    expect(createMajorSeventhShapes(createMajorSeventh('C'), { fretCount: 0 })).toEqual([])
    expect(createMajorSeventhShapes(createMajorSeventh('C'), { fretCount: 12 })
      .every(shape => shape.notes.every(note => note.fret >= 0 && note.fret <= 12))).toBe(true)
    expect(() => createMajorSeventhShapes(createMajorSeventh('C'), { fretCount: -1 })).toThrow('Fret count')
  })
})
