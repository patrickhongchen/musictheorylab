import type { PitchClass } from '../music/types'
import { displayNote } from '../presentation/notes'

interface Props { notes: readonly PitchClass[]; selectedIndex: number; onSelect: (index: number) => void }
export function NoteSelector({ notes, selectedIndex, onSelect }: Props) {
  return <fieldset className="note-selector">
    <legend>Top note</legend>
    <div className="note-buttons">
      {notes.map((note, index) => <label className={`note-choice ${selectedIndex === index ? 'is-selected' : ''}`} key={note.name}>
        <input type="radio" name="top-note" value={note.name} checked={selectedIndex === index} onChange={() => onSelect(index)} aria-label={`${displayNote(note.name)}, scale degree ${index + 1}`} />
        <span className="note-face">{displayNote(note.name)}</span>
        <span className="scale-degree" aria-hidden="true">{index + 1}</span>
      </label>)}
    </div>
  </fieldset>
}
