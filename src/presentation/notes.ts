import type { ChordQuality, ChordToneRole } from '../music/types'

/** Typography only. Never changes the domain spelling or acoustic pitch. */
export const displayNote = (value: string) => value.replaceAll('#', '♯').replaceAll('b', '♭')

export const ROLE_STYLE: Record<ChordToneRole, { label: string; number: string; color: string }> = {
  root: { label: 'Root', number: '1', color: '#22685b' },
  third: { label: 'Third', number: '3', color: '#a24b22' },
  fifth: { label: 'Fifth', number: '5', color: '#72558e' },
}

/** Labels a chord tone relative to its own chord rather than the parent key. */
export function chordIntervalLabel(role: ChordToneRole | 'seventh', quality: ChordQuality | 'major7') {
  if (role === 'seventh') return '7'
  if (role === 'root') return 'R'
  if (role === 'third') return quality === 'minor' || quality === 'diminished' ? '♭3' : '3'
  if (quality === 'diminished') return '♭5'
  return quality === 'augmented' ? '♯5' : '5'
}
