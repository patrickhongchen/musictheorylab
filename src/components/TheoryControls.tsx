import { MAJOR_KEYS } from '../music/scales'
import { displayNote } from '../presentation/notes'

export function TheoryControls({ tonic, onKeyChange }: { tonic: string; onKeyChange: (tonic: string) => void }) {
  return <label className="key-control">
    <span>Key</span>
    <select value={tonic} onChange={event => onKeyChange(event.target.value)}>
      {MAJOR_KEYS.map(key => <option key={key.tonic} value={key.tonic}>{displayNote(key.tonic)} Major</option>)}
    </select>
  </label>
}
