import type { TriadResult } from '../music/types'
import { displayNote } from '../presentation/notes'
import { ToneNotes } from './ToneNotes'

interface Props { result: TriadResult; selected: boolean; onSelect: () => void }
export function ChordOptionCard({ result: { triad, voicing }, selected, onSelect }: Props) {
  return <label className={`chord-option ${selected ? 'is-selected' : ''}`}>
    <input type="radio" name="chord" checked={selected} onChange={onSelect} aria-label={`${triad.romanNumeral}, ${displayNote(triad.chordName)}, ${voicing.inversion.name}`} />
    <span className="selection-dot" aria-hidden="true" />
    <span className="chord-name">{displayNote(triad.chordName)}</span>
    <span className="roman">{triad.romanNumeral}</span>
    <ToneNotes notes={voicing.notes} roles />
    <span className="chord-inversion">{voicing.inversion.name}</span>
  </label>
}
