import type { ChordToneRole, Inversion } from './types'

export type VoicingLayout = 'closed' | 'spread'

export const TRIAD_INVERSIONS: Readonly<Record<ChordToneRole, Inversion>> = {
  root: { index: 0, name: 'Root position', figure: '' },
  third: { index: 1, name: 'First inversion', figure: '6' },
  fifth: { index: 2, name: 'Second inversion', figure: '6/4' },
}
