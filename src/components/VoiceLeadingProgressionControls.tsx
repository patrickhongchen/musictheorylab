import type {
  ChordChoice,
  ChordChoiceUpdate,
  LowestString,
  VoiceLeadingChoiceQuality,
  VoiceLeadingVoicing,
} from '../music/voiceLeading'
import {
  LOWEST_STRING_OPTIONS,
  VOICE_LEADING_QUALITIES,
  voicingOptionsForQuality,
} from '../music/voiceLeading'
import { displayNote } from '../presentation/notes'

const ROOTS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']
const TRANSPOSE_OPTIONS = [
  'Half step (1 semitone)', 'Whole step (2 semitones)', 'Minor 3rd (3 semitones)',
  'Major 3rd (4 semitones)', 'Perfect 4th (5 semitones)', 'Tritone (6 semitones)',
  'Perfect 5th (7 semitones)', 'Minor 6th (8 semitones)', 'Major 6th (9 semitones)',
  'Minor 7th (10 semitones)', 'Major 7th (11 semitones)',
]

export interface VoiceLeadingPreset {
  readonly label: string
  readonly chords: readonly ChordChoice[]
}

interface Props {
  chords: readonly ChordChoice[]
  presets: readonly VoiceLeadingPreset[]
  presetIndex: number
  lowestString: LowestString
  transposeAmount: number
  onSelectPreset: (index: number) => void
  onLowestStringChange: (lowestString: LowestString) => void
  onTransposeAmountChange: (amount: number) => void
  onTranspose: (direction: -1 | 1) => void
  onUpdateChord: (id: string, update: ChordChoiceUpdate) => void
  onMoveChord: (index: number, nextIndex: number) => void
  onRemoveChord: (index: number) => void
  onAddChord: () => void
}

export const voiceLeadingQualityLabel = (quality: VoiceLeadingChoiceQuality) => (
  quality === 'major7' ? 'Major 7' : quality[0].toUpperCase() + quality.slice(1)
)

function ArrowIcon({ direction }: { direction: 'left' | 'right' | 'up' | 'down' }) {
  const paths = {
    left: 'M19 12H5m7 7-7-7 7-7',
    right: 'M5 12h14m-7-7 7 7-7 7',
    up: 'M12 19V5m-7 7 7-7 7 7',
    down: 'M12 5v14m7-7-7 7-7-7',
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d={paths[direction]} /></svg>
}

function TrashIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg>
}

function PlusIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
}

interface ChordCardProps {
  chord: ChordChoice
  index: number
  chordCount: number
  onUpdate: (update: ChordChoiceUpdate) => void
  onMove: (nextIndex: number) => void
  onRemove: () => void
}

function ProgressionChordCard({ chord, index, chordCount, onUpdate, onMove, onRemove }: ChordCardProps) {
  const chordName = `${displayNote(chord.root)} ${voiceLeadingQualityLabel(chord.quality)}`
  return <li className="voice-chord-item">
    <fieldset className="voice-chord-card">
      <legend className="sr-only">Chord {index + 1}: {chordName}</legend>
      <header>
        <span className="voice-chord-number" aria-hidden="true">{index + 1}</span>
        <strong>{chordName}</strong>
        <button className="voice-chord-delete" type="button" title={`Remove chord ${index + 1}`} aria-label={`Remove chord ${index + 1}: ${chordName}`} disabled={chordCount <= 1} onClick={onRemove}><TrashIcon /></button>
      </header>
      <div className="voice-chord-inputs">
        <label>Root<select value={chord.root} onChange={event => onUpdate({ root: event.target.value })}>
          {ROOTS.map(root => <option key={root} value={root}>{displayNote(root)}</option>)}
        </select></label>
        <label>Type<select value={chord.quality} onChange={event => onUpdate({ quality: event.target.value as VoiceLeadingChoiceQuality })}>
          {VOICE_LEADING_QUALITIES.map(quality => <option key={quality} value={quality}>{voiceLeadingQualityLabel(quality)}</option>)}
        </select></label>
        <label>Voicing<select value={chord.voicing} onChange={event => onUpdate({ voicing: event.target.value as VoiceLeadingVoicing })}>
          {voicingOptionsForQuality(chord.quality).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select></label>
      </div>
      <div className="voice-chord-actions" aria-label={`Reorder chord ${index + 1}`}>
        <button type="button" title="Move chord left" aria-label={`Move chord ${index + 1} left`} disabled={index === 0} onClick={() => onMove(index - 1)}><ArrowIcon direction="left" /></button>
        <button type="button" title="Move chord right" aria-label={`Move chord ${index + 1} right`} disabled={index === chordCount - 1} onClick={() => onMove(index + 1)}><ArrowIcon direction="right" /></button>
      </div>
    </fieldset>
    <span className="voice-sequence-arrow" aria-hidden="true"><ArrowIcon direction="right" /></span>
  </li>
}

export function VoiceLeadingProgressionControls({
  chords,
  presets,
  presetIndex,
  lowestString,
  transposeAmount,
  onSelectPreset,
  onLowestStringChange,
  onTransposeAmountChange,
  onTranspose,
  onUpdateChord,
  onMoveChord,
  onRemoveChord,
  onAddChord,
}: Props) {
  return <section className="voice-leading-controls" aria-label="Voice leading controls">
    <div className="voice-settings-toolbar">
      <label>Progression<select value={presetIndex < 0 ? 'custom' : presetIndex} onChange={event => onSelectPreset(Number(event.target.value))}>
        {presets.map((preset, index) => <option key={index} value={index}>{preset.label}</option>)}
        {presetIndex < 0 && <option value="custom">Custom progression</option>}
      </select></label>
      <label>Lowest string<select value={lowestString} onChange={event => onLowestStringChange(Number(event.target.value) as LowestString)}>
        {LOWEST_STRING_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select></label>
      <div className="voice-transpose-controls">
        <label>Transpose all<select value={transposeAmount} onChange={event => onTransposeAmountChange(Number(event.target.value))}>
          {TRANSPOSE_OPTIONS.map((label, index) => <option key={index + 1} value={index + 1}>{label}</option>)}
        </select></label>
        <div className="voice-transpose-buttons" aria-label="Transpose direction">
          <button type="button" onClick={() => onTranspose(-1)}><ArrowIcon direction="down" />Down</button>
          <button type="button" onClick={() => onTranspose(1)}><ArrowIcon direction="up" />Up</button>
        </div>
        <span>Shifts every chord together.</span>
      </div>
    </div>
    <div className="voice-progression-editor">
      <h2>Progression</h2>
      <ol className="voice-chord-fields">
        {chords.map((chord, index) => <ProgressionChordCard
          key={chord.id}
          chord={chord}
          index={index}
          chordCount={chords.length}
          onUpdate={update => onUpdateChord(chord.id, update)}
          onMove={nextIndex => onMoveChord(index, nextIndex)}
          onRemove={() => onRemoveChord(index)}
        />)}
        <li className="voice-add-item">
          <button className="voice-add-chord" type="button" disabled={chords.length >= 8} onClick={onAddChord}>
            <span><PlusIcon /></span>Add chord
          </button>
        </li>
      </ol>
    </div>
  </section>
}
