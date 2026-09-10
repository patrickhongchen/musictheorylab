import { useState } from 'react'
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
  onAddChord: () => string
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

function DragIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" /></svg>
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
  const [selectedChordId, setSelectedChordId] = useState(chords[0]?.id ?? '')
  const [draggedChordId, setDraggedChordId] = useState<string>()
  const [dropTargetId, setDropTargetId] = useState<string>()
  const selectedChord = chords.find(chord => chord.id === selectedChordId) ?? chords[0]
  const selectedIndex = selectedChord ? chords.findIndex(chord => chord.id === selectedChord.id) : -1
  const selectedChordName = selectedChord
    ? `${displayNote(selectedChord.root)} ${voiceLeadingQualityLabel(selectedChord.quality)}`
    : ''

  function finishDrag() {
    setDraggedChordId(undefined)
    setDropTargetId(undefined)
  }

  function dropChord(targetId: string) {
    if (!draggedChordId || draggedChordId === targetId) return finishDrag()
    const currentIndex = chords.findIndex(chord => chord.id === draggedChordId)
    const nextIndex = chords.findIndex(chord => chord.id === targetId)
    if (currentIndex >= 0 && nextIndex >= 0) onMoveChord(currentIndex, nextIndex)
    finishDrag()
  }

  return <section className="voice-leading-controls" aria-label="Voice leading controls">
    <div className="voice-settings-toolbar">
      <label>Progression<select value={presetIndex < 0 ? 'custom' : presetIndex} onChange={event => {
        const nextPresetIndex = Number(event.target.value)
        onSelectPreset(nextPresetIndex)
        const firstChord = presets[nextPresetIndex]?.chords[0]
        if (firstChord) setSelectedChordId(firstChord.id)
      }}>
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
      <div className="voice-progression-heading">
        <h2>Progression</h2>
        <span>Choose a chord to edit · drag to reorder</span>
      </div>
      <ol className="voice-chord-rail" aria-label="Chord progression">
        {chords.map((chord, index) => {
          const chordName = `${displayNote(chord.root)} ${voiceLeadingQualityLabel(chord.quality)}`
          const voicingName = voicingOptionsForQuality(chord.quality).find(option => option.value === chord.voicing)?.label
          return <li
            className="voice-chord-step"
            data-active={chord.id === selectedChord?.id}
            data-dragging={chord.id === draggedChordId}
            data-drop-target={chord.id === dropTargetId}
            key={chord.id}
            onDragEnter={() => draggedChordId && setDropTargetId(chord.id)}
            onDragOver={event => {
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
            }}
            onDrop={event => {
              event.preventDefault()
              dropChord(chord.id)
            }}
          >
            <button
              className="voice-chord-select"
              type="button"
              draggable
              aria-pressed={chord.id === selectedChord?.id}
              aria-label={`Edit chord ${index + 1}: ${chordName}`}
              onDragStart={event => {
                setDraggedChordId(chord.id)
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', chord.id)
              }}
              onDragEnd={finishDrag}
              onClick={() => setSelectedChordId(chord.id)}
            >
              <span className="voice-chord-number" aria-hidden="true">{index + 1}</span>
              <span className="voice-chord-summary"><strong>{chordName}</strong><small>{voicingName}</small></span>
              <span className="voice-chord-drag" aria-hidden="true"><DragIcon /></span>
            </button>
          </li>
        })}
        <li className="voice-add-step">
          <button className="voice-add-chord" type="button" disabled={chords.length >= 8} onClick={() => setSelectedChordId(onAddChord())}>
            <PlusIcon />Add chord
          </button>
        </li>
      </ol>
      {selectedChord && <fieldset className="voice-chord-editor" key={selectedChord.id}>
        <legend className="sr-only">Edit chord {selectedIndex + 1}: {selectedChordName}</legend>
        <div className="voice-chord-editor-title">
          <small>Editing {selectedIndex + 1}</small>
          <strong>{selectedChordName}</strong>
        </div>
        <div className="voice-chord-inputs">
          <label>Root<select value={selectedChord.root} onChange={event => onUpdateChord(selectedChord.id, { root: event.target.value })}>
            {ROOTS.map(root => <option key={root} value={root}>{displayNote(root)}</option>)}
          </select></label>
          <label>Type<select value={selectedChord.quality} onChange={event => onUpdateChord(selectedChord.id, { quality: event.target.value as VoiceLeadingChoiceQuality })}>
            {VOICE_LEADING_QUALITIES.map(quality => <option key={quality} value={quality}>{voiceLeadingQualityLabel(quality)}</option>)}
          </select></label>
          <label>Voicing<select value={selectedChord.voicing} onChange={event => onUpdateChord(selectedChord.id, { voicing: event.target.value as VoiceLeadingVoicing })}>
            {voicingOptionsForQuality(selectedChord.quality).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select></label>
        </div>
        <div className="voice-chord-actions" aria-label={`Reorder or remove chord ${selectedIndex + 1}`}>
          <button type="button" title="Move chord earlier" aria-label={`Move chord ${selectedIndex + 1} earlier`} disabled={selectedIndex === 0} onClick={() => onMoveChord(selectedIndex, selectedIndex - 1)}><ArrowIcon direction="left" /></button>
          <button type="button" title="Move chord later" aria-label={`Move chord ${selectedIndex + 1} later`} disabled={selectedIndex === chords.length - 1} onClick={() => onMoveChord(selectedIndex, selectedIndex + 1)}><ArrowIcon direction="right" /></button>
          <span aria-hidden="true" />
          <button className="voice-chord-delete" type="button" title={`Remove chord ${selectedIndex + 1}`} aria-label={`Remove chord ${selectedIndex + 1}: ${selectedChordName}`} disabled={chords.length <= 1} onClick={() => {
            const nextSelected = chords[selectedIndex + 1] ?? chords[selectedIndex - 1]
            if (nextSelected) setSelectedChordId(nextSelected.id)
            onRemoveChord(selectedIndex)
          }}><TrashIcon /></button>
        </div>
      </fieldset>}
    </div>
  </section>
}
