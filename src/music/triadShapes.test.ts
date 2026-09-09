import { describe, expect, it } from 'vitest'
import { STANDARD_TUNING } from './fretboard'
import { createTriadShapesOnStrings, groupTriadShapeRepeats, triadShapeFamilyId } from './triadShapes'
import { MAJOR_KEYS, createScale } from './scales'
import { diatonicTriads } from './triads'
import type { Triad } from './types'

const cMajorTriads = diatonicTriads(createScale({ tonic: 'C', mode: 'major' }))
const triadForDegree = (degree: number) => cMajorTriads[degree - 1]

const shapeKey = (shape: { readonly notes: readonly { readonly string: number; readonly fret: number }[] }) => (
  shape.notes.map(note => `${note.string}:${note.fret}`).join('|')
)

/** A coordinate-first enumeration used to verify the public generator's completeness. */
function bruteForceKeys(triad: Triad, strings: readonly number[], fretCount = 22): readonly string[] {
  const all: string[] = []
  for (let highFret = 0; highFret <= fretCount; highFret++) {
    for (let middleFret = 0; middleFret <= fretCount; middleFret++) {
      for (let lowFret = 0; lowFret <= fretCount; lowFret++) {
        const frets = [highFret, middleFret, lowFret]
        const notes = frets.map((fret, index) => ({
          string: strings[index],
          fret,
          tone: triad.tones.find(tone => (
            tone.pitchClass.chroma === (STANDARD_TUNING[STANDARD_TUNING.length - strings[index]].midi + fret) % 12
          )),
        }))
        const midi = notes.map(note => STANDARD_TUNING[STANDARD_TUNING.length - note.string].midi + note.fret)
        if (
          notes.every(note => note.tone)
          && new Set(notes.map(note => note.tone?.role)).size === 3
          && Math.max(...frets) - Math.min(...frets) <= 5
          && midi[0] > midi[1]
          && midi[1] > midi[2]
          && midi[0] - midi[2] < 12
        ) all.push(notes.map(note => `${note.string}:${note.fret}`).join('|'))
      }
    }
  }
  return all.sort()
}

describe('createTriadShapesOnStrings', () => {
  it('returns C-major root, first, and second inversion shapes on strings 1–3', () => {
    const shapes = createTriadShapesOnStrings(triadForDegree(1), [1, 2, 3])

    expect(shapes.map(shape => shape.inversion.index)).toContain(0)
    expect(shapes.map(shape => shape.inversion.index)).toContain(1)
    expect(shapes.map(shape => shape.inversion.index)).toContain(2)
    expect(shapes.find(shape => shapeKey(shape) === '1:3|2:5|3:5')?.inversion.name).toBe('Root position')
    expect(shapes.find(shape => shapeKey(shape) === '1:8|2:8|3:9')?.inversion.name).toBe('First inversion')
    expect(shapes.find(shape => shapeKey(shape) === '1:0|2:1|3:0')?.inversion.name).toBe('Second inversion')
  })

  it.each([
    [1, [1, 2, 3]], [4, [1, 2, 3]], [5, [1, 2, 3]],
    [1, [2, 3, 4]], [1, [3, 4, 5]], [1, [4, 5, 6]],
  ])('returns every valid compact close-position coordinate for degree %s on strings %s', (degree, strings) => {
    const triad = triadForDegree(degree)
    const shapes = createTriadShapesOnStrings(triad, strings)

    expect(shapes.map(shapeKey).sort()).toEqual(bruteForceKeys(triad, strings))
  })

  it('uses each triad role once, classifies inversion from its sounding bass, and stays in range', () => {
    const shapes = createTriadShapesOnStrings(triadForDegree(5), [3, 4, 5], undefined, 12)

    expect(shapes).not.toHaveLength(0)
    expect(new Set(shapes.map(shapeKey)).size).toBe(shapes.length)
    shapes.forEach(shape => {
      const roles = shape.notes.map(note => note.tone.role).sort()
      const midi = shape.notes.map(note => STANDARD_TUNING[STANDARD_TUNING.length - note.string].midi + note.fret)
      expect(roles).toEqual(['fifth', 'root', 'third'])
      expect(shape.inversion.index).toBe({ root: 0, third: 1, fifth: 2 }[shape.notes[2].tone.role])
      expect(midi[0]).toBeGreaterThan(midi[1])
      expect(midi[1]).toBeGreaterThan(midi[2])
      expect(Math.max(...shape.notes.map(note => note.fret)) - Math.min(...shape.notes.map(note => note.fret))).toBeLessThanOrEqual(5)
      expect(shape.notes.every(note => note.fret >= 0 && note.fret <= 12)).toBe(true)
    })
  })


  it('excludes the spread E–C–G voicings on strings 4–6 while retaining every close inversion', () => {
    const shapes = createTriadShapesOnStrings(triadForDegree(1), [4, 5, 6])
    expect(shapes.map(shapeKey)).toEqual([
      '4:2|5:3|6:3',
      '4:5|5:7|6:8',
      '4:10|5:10|6:12',
      '4:14|5:15|6:15',
      '4:17|5:19|6:20',
    ])
    expect(shapes.find(shape => shapeKey(shape) === '4:10|5:10|6:12')?.inversion.name).toBe('First inversion')
  })

  it.each(MAJOR_KEYS)('keeps cyclic bass-to-top role order for every triad and string group in $tonic major', key => {
    const orders = [
      ['root', 'third', 'fifth'],
      ['third', 'fifth', 'root'],
      ['fifth', 'root', 'third'],
    ]
    for (const triad of diatonicTriads(createScale(key))) {
      for (const start of [1, 2, 3, 4]) {
        const shapes = createTriadShapesOnStrings(triad, [start, start + 1, start + 2])
        expect(new Set(shapes.map(shape => shape.inversion.index)).size).toBe(3)
        for (const shape of shapes) {
          expect([...shape.notes].reverse().map(note => note.tone.role)).toEqual(orders[shape.inversion.index])
        }
      }
    }
  })

  it('requires exactly three adjacent valid strings', () => {
    const triad = triadForDegree(1)
    expect(() => createTriadShapesOnStrings(triad, [1, 2])).toThrow('exactly three adjacent strings')
    expect(() => createTriadShapesOnStrings(triad, [1, 2, 4])).toThrow('exactly three adjacent strings')
    expect(() => createTriadShapesOnStrings(triad, [0, 1, 2])).toThrow('exactly three adjacent strings')
  })
})


describe('octave shape groups', () => {
  it('combines octave repeats without losing any fretboard positions or merging string groups', () => {
    const triad = triadForDegree(1)
    const shapes = [1, 2, 3, 4].flatMap(start => createTriadShapesOnStrings(triad, [start, start + 1, start + 2]))
    const groups = groupTriadShapeRepeats(shapes)
    expect(groups).toHaveLength(12)
    expect(groups.flat().map(shapeKey).sort()).toEqual(shapes.map(shapeKey).sort())
    for (const group of groups) {
      const first = group[0]
      for (const shape of group) {
        expect(triadShapeFamilyId(shape)).toBe(triadShapeFamilyId(first))
        const offset = shape.notes[0].fret - first.notes[0].fret
        expect(offset % 12).toBe(0)
        expect(shape.notes.every((note, index) => note.string === first.notes[index].string && note.fret - first.notes[index].fret === offset)).toBe(true)
      }
    }
    const rootGroup = groups.find(group => shapeKey(group[0]) === '1:3|2:5|3:5')!
    expect(rootGroup.map(shape => shape.notes.find(note => note.tone.role === 'root')?.fret)).toEqual([5, 17])
  })
})
