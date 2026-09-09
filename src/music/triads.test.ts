import { describe, expect, it } from 'vitest'
import { createTriad } from './triads'
import { createTriadShapesOnStrings } from './triadShapes'

describe('independent triads', () => {
  it.each([
    ['C', 'major', ['C', 'E', 'G']],
    ['F#', 'minor', ['F#', 'A', 'C#']],
    ['Bb', 'diminished', ['Bb', 'Db', 'Fb']],
    ['G#', 'augmented', ['G#', 'B#', 'D##']],
  ] as const)('spells %s %s and generates all three inversions', (root, quality, notes) => {
    const triad = createTriad(root, quality)
    expect(triad.tones.map(tone => tone.pitchClass.name)).toEqual(notes)
    const shapes = createTriadShapesOnStrings(triad, [1, 2, 3])
    expect(new Set(shapes.map(shape => shape.inversion.index))).toEqual(new Set([0, 1, 2]))
  })

  it('keeps different qualities on the same root distinct', () => {
    expect(createTriad('C', 'major').id).not.toBe(createTriad('C', 'minor').id)
  })
})
