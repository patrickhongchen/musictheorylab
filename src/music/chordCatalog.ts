import { Note } from 'tonal'
import { pitchClass } from './pitches'
import type { PitchClass } from './types'

const TRIAD_ROLES = ['root', 'third', 'fifth'] as const
const SEVENTH_ROLES = [...TRIAD_ROLES, 'seventh'] as const

/** Chord theory only; ordering here is root position, never guitar geometry. */
export const CHORD_CATALOG = {
  major: { intervals: ['1P', '3M', '5P'], labels: ['1', '3', '5'], roles: TRIAD_ROLES, suffix: '' },
  minor: { intervals: ['1P', '3m', '5P'], labels: ['1', 'b3', '5'], roles: TRIAD_ROLES, suffix: 'm' },
  diminished: { intervals: ['1P', '3m', '5d'], labels: ['1', 'b3', 'b5'], roles: TRIAD_ROLES, suffix: 'dim' },
  augmented: { intervals: ['1P', '3M', '5A'], labels: ['1', '3', '#5'], roles: TRIAD_ROLES, suffix: 'aug' },
  major7: { intervals: ['1P', '3M', '5P', '7M'], labels: ['1', '3', '5', '7'], roles: SEVENTH_ROLES, suffix: 'maj7' },
  minor7: { intervals: ['1P', '3m', '5P', '7m'], labels: ['1', 'b3', '5', 'b7'], roles: SEVENTH_ROLES, suffix: 'm7' },
  dominant7: { intervals: ['1P', '3M', '5P', '7m'], labels: ['1', '3', '5', 'b7'], roles: SEVENTH_ROLES, suffix: '7' },
} as const

export type ChordQuality = keyof typeof CHORD_CATALOG
export type ChordToneRole = typeof SEVENTH_ROLES[number]
export const TRIAD_QUALITIES = ['major', 'minor', 'diminished', 'augmented'] as const satisfies readonly ChordQuality[]

/** Retains functional spelling and the definition's narrow role/label types. */
export function createChordTones<Role extends ChordToneRole, Label extends string>(
  root: PitchClass,
  definition: { readonly intervals: readonly string[]; readonly roles: readonly Role[]; readonly labels: readonly Label[] },
) {
  return definition.intervals.map((interval, index) => ({
    pitchClass: pitchClass(Note.transpose(root.name, interval)),
    interval,
    role: definition.roles[index],
    label: definition.labels[index],
  }))
}
