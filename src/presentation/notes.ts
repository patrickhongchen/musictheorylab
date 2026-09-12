import { CHORD_CATALOG } from '../music/chordCatalog'
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
  if (role === 'root') return 'R'
  const definition = CHORD_CATALOG[quality]
  const index = definition.roles.findIndex(candidate => candidate === role)
  return index < 0 ? '' : displayNote(definition.labels[index])
}
