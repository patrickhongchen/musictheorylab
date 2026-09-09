import type { ChordToneRole, Inversion } from './types'

export type VoicingLayout = 'closed' | 'spread'

/** Musical order only; guitar strings and hand positions are independent. */
export interface VoicingPattern<Role extends string = ChordToneRole> {
  readonly id: string
  readonly layout: VoicingLayout
  readonly bassToTop: readonly Role[]
  readonly inversion: Inversion
}

export const TRIAD_INVERSIONS: Readonly<Record<ChordToneRole, Inversion>> = {
  root: { index: 0, name: 'Root position', figure: '' },
  third: { index: 1, name: 'First inversion', figure: '6' },
  fifth: { index: 2, name: 'Second inversion', figure: '6/4' },
}

function patterns(layout: VoicingLayout, orders: readonly (readonly ChordToneRole[])[]): readonly VoicingPattern[] {
  return orders.map(bassToTop => ({
    id: `${layout}:${bassToTop.join('-')}`, layout, bassToTop, inversion: TRIAD_INVERSIONS[bassToTop[0]],
  }))
}

export const TRIAD_VOICING_PATTERNS = {
  closed: patterns('closed', [['root', 'third', 'fifth'], ['third', 'fifth', 'root'], ['fifth', 'root', 'third']]),
  spread: patterns('spread', [['root', 'fifth', 'third'], ['third', 'root', 'fifth'], ['fifth', 'third', 'root']]),
} as const
