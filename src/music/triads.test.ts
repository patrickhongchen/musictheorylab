import { describe, expect, it } from 'vitest'
import { createTriad } from './triads'

describe('independent triads', () => {
  it.each([
    ['C', 'major', ['C', 'E', 'G']],
    ['F#', 'minor', ['F#', 'A', 'C#']],
    ['Bb', 'diminished', ['Bb', 'Db', 'Fb']],
    ['G#', 'augmented', ['G#', 'B#', 'D##']],
  ] as const)('spells %s %s', (root, quality, notes) => {
    const triad = createTriad(root, quality)
    expect(triad.tones.map(tone => tone.pitchClass.name)).toEqual(notes)
    expect(triad.tones.map(tone => tone.role)).toEqual(['root', 'third', 'fifth'])
  })

  it('keeps different qualities on the same root distinct', () => {
    expect(createTriad('C', 'major').id).not.toBe(createTriad('C', 'minor').id)
  })
})
