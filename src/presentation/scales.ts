import { ROLE_STYLE } from './notes'

type ScaleToneRole = 'root' | 'third' | 'fifth' | 'color'

/** Shared by the scale overview, notation, and fretboard. */
export const SCALE_TONE_STYLE: Record<ScaleToneRole, { label: string; color: string }> = {
  ...ROLE_STYLE,
  root: { ...ROLE_STYLE.root, label: 'Tonic' },
  color: { label: 'Scale tone', color: '#656961' },
}

export function scaleToneRole(label: string): ScaleToneRole {
  if (label === '1') return 'root'
  if (label === '3' || label === 'b3' || label === '♭3') return 'third'
  if (label === '5') return 'fifth'
  return 'color'
}
