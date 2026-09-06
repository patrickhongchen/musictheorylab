import type { VoicedNote } from '../music/types'
import { displayNote, ROLE_STYLE } from '../presentation/notes'

export function ToneNotes({ notes, octaves = false, roles = false }: { notes: readonly VoicedNote[]; octaves?: boolean; roles?: boolean }) {
  return <span className={`tone-notes ${roles ? 'with-roles' : ''}`}>
    {notes.map(note => <span key={note.pitch.scientific} className={`tone-note role-${note.role}`} title={ROLE_STYLE[note.role].label}>
      <span>{displayNote(octaves ? note.pitch.scientific : note.pitch.name)}</span>
      {roles && <small aria-label={ROLE_STYLE[note.role].label}>{ROLE_STYLE[note.role].number}</small>}
    </span>)}
  </span>
}
