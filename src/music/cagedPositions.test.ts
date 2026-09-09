import { expect, it } from 'vitest'
import { classifyCagedForm } from './cagedPositions'
import { createTriadShapesOnStrings } from './triadShapes'
import { createTriad } from './triads'

it.each([['C', 0], ['D', 2]] as const)('labels familiar closed grips and octave repeats in %s', (root, shift) => {
  const triad = createTriad(root, 'major')
  const shapes = createTriadShapesOnStrings(triad, [1, 2, 3], undefined, 24)
  for (const [frets, form] of [[[3, 5, 5], 'A'], [[8, 8, 9], 'E'], [[0, 1, 0], 'C']] as const) {
    const shape = shapes.find(shape => shape.notes.every((note, index) => note.fret === frets[index] + shift))!
    expect(shape).toBeDefined()
    expect(classifyCagedForm(triad, shape.notes)).toBe(form)
    expect(classifyCagedForm(triad, shape.notes.map(note => ({ ...note, fret: note.fret + 12 })))).toBe(form)
  }
})

it.each(['major', 'minor', 'diminished', 'augmented'] as const)('keeps %s closed grip labels consistent across octaves', quality => {
  const triad = createTriad('A', quality)
  for (const start of [1, 2, 3, 4]) {
    const shapes = createTriadShapesOnStrings(triad, [start, start + 1, start + 2])
    for (const shape of shapes) {
      const form = classifyCagedForm(triad, shape.notes)
      expect(['C', 'A', 'G', 'E', 'D']).toContain(form)
      expect(classifyCagedForm(triad, shape.notes.map(note => ({ ...note, fret: note.fret + 12 })))).toBe(form)
    }
  }
})
