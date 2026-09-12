import { describe, expect, it } from 'vitest'
import { chordShapeFamilyId, groupChordShapeRepeats, soundingBass, type PlayableChordShape } from './chordShapes'
import { STANDARD_TUNING } from './fretboard'
import { createMajorSeventh, createMajorSeventhShapes, MAJOR_SEVENTH_SHAPE_TEMPLATES } from './majorSeventhShapes'
import { createTriadShapesFromTemplates } from './triadShapeTemplates'
import { createTriad } from './triads'

const physicalKey = (shape: { readonly notes: readonly { readonly string: number; readonly fret: number }[] }) => (
  shape.notes.map(note => `${note.string}:${note.fret}`).join('|')
)
const midi = (note: { readonly string: number; readonly fret: number }) => (
  STANDARD_TUNING[STANDARD_TUNING.length - note.string].midi + note.fret
)
const rootFret = (shape: PlayableChordShape) => {
  const template = MAJOR_SEVENTH_SHAPE_TEMPLATES.find(candidate => candidate.id === shape.templateId)!
  return shape.notes.find(note => note.string === template.rootString && note.tone.role === 'root')!.fret
}

describe('Major 7 chords and curated guitar shapes', () => {
  it('keeps playable Major 7 identity and naming', () => {
    expect(createMajorSeventh('C')).toMatchObject({ id: 'C:major7', quality: 'major7', chordName: 'C major 7' })
  })

  it('transposes a template while retaining its strings, offsets, and roles', () => {
    const c = createMajorSeventhShapes(createMajorSeventh('C'))
      .find(shape => shape.templateId === 'e-root-r735' && rootFret(shape) === 8)!
    const d = createMajorSeventhShapes(createMajorSeventh('D'))
      .find(shape => shape.templateId === 'e-root-r735' && rootFret(shape) === 10)!

    expect(d.notes.map(note => [note.string, note.fret - rootFret(d), note.tone.role]))
      .toEqual(c.notes.map(note => [note.string, note.fret - rootFret(c), note.tone.role]))
    expect(d.notes.map(note => note.fret)).toEqual(c.notes.map(note => note.fret + 2))
    expect(d.notes.map(note => note.tone.pitchClass.name)).toEqual(['A', 'F#', 'C#', 'D'])
  })

  it('classifies R-7-3-5 from the actual sounding bass and retains the skipped string', () => {
    const shape = createMajorSeventhShapes(createMajorSeventh('C'))
      .find(candidate => candidate.templateId === 'e-root-r735' && rootFret(candidate) === 8)!
    const bassToTop = [...shape.notes].sort((left, right) => midi(left) - midi(right))

    expect(bassToTop.map(note => note.tone.role)).toEqual(['root', 'seventh', 'third', 'fifth'])
    expect(shape.inversion).toMatchObject({ index: 0, name: 'Root position' })
    expect(soundingBass(shape).tone.role).toBe('root')
    expect(soundingBass({ ...shape, notes: [...shape.notes].reverse() }).tone.role).toBe('root')
    expect(shape.notes.map(note => note.string).sort()).toEqual([2, 3, 4, 6])
  })

  it('provides all four inversions and derives each from its lowest MIDI note', () => {
    const shapes = createMajorSeventhShapes(createMajorSeventh('C'))
      .filter(shape => shape.templateId.startsWith('drop2-top4-') && Math.max(...shape.notes.map(note => note.fret)) < 13)
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

  it('stores invariant CAGED relationships directly on every template', () => {
    expect(Object.fromEntries(MAJOR_SEVENTH_SHAPE_TEMPLATES.map(template => [template.id, template.cagedForms]))).toEqual({
      'drop2-top4-root': ['D'],
      'drop2-top4-first': ['C', 'A'],
      'drop2-top4-second': ['G'],
      'drop2-top4-third': ['E'],
      'a-root-r573': ['A'],
      'e-root-r735': ['E'],
      'a-first-37r5': ['G', 'E'],
      'a-second-5r37': ['D'],
      'a-third-735r': ['C'],
      'e-first-3r57': ['D'],
      'e-second-537r': ['C', 'A'],
      'e-third-75r3': ['G'],
    })
  })

  it('preserves template CAGED metadata through transposition and octave repeats', () => {
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']) {
      for (const shape of createMajorSeventhShapes(createMajorSeventh(root), { fretCount: 36 })) {
        const template = MAJOR_SEVENTH_SHAPE_TEMPLATES.find(candidate => candidate.id === shape.templateId)!
        expect(shape.cagedForms).toEqual(template.cagedForms)
      }
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
            expect(shape.notes.map(note => note.string).join(',')).toBe(strings)
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
    expect(repeats.map(rootFret)).toEqual([8, 20])
    expect(new Set(repeats.map(chordShapeFamilyId)).size).toBe(1)
  })

  it('groups canonical triads alongside Major 7 shapes', () => {
    const triadShapes = createTriadShapesFromTemplates(createTriad('G', 'major'), 'closed', { fretCount: 12 })
    const majorSevenths = createMajorSeventhShapes(createMajorSeventh('C'), { fretCount: 12 })
    const mixed = [...triadShapes, ...majorSevenths]
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
