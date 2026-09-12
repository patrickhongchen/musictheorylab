import { describe, expect, it } from 'vitest'
import { createTriad } from './triads'

describe('independent triads', () => {
  it('keeps different qualities on the same root distinct', () => {
    expect(createTriad('C', 'major')).toMatchObject({ id: 'C:major', chordName: 'C major', quality: 'major' })
    expect(createTriad('C', 'major').id).not.toBe(createTriad('C', 'minor').id)
  })
})
