import { describe, expect, it } from 'vitest'
import type { ChordQuality, ChordToneRole } from '../music/types'
import { chordIntervalLabel } from './notes'

describe('chordIntervalLabel', () => {
  it.each<[ChordQuality, readonly string[]]>([
    ['major', ['R', '3', '5']],
    ['minor', ['R', '♭3', '5']],
    ['diminished', ['R', '♭3', '♭5']],
    ['augmented', ['R', '3', '♯5']],
  ])('labels %s triads relative to their chord', (quality, expected) => {
    const roles: ChordToneRole[] = ['root', 'third', 'fifth']
    expect(roles.map(role => chordIntervalLabel(role, quality))).toEqual(expected)
  })
})
