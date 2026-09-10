import { Fragment, useMemo, useRef, useState, type CSSProperties } from 'react'
import { PROGRESSION_STEP_COLORS } from '../components/ProgressionPathView'
import { fretLabel, shapeCagedLabel, shapeColor, shapeInspection, ChordShapeFretboard } from '../components/ChordShapeFretboard'
import { transposePitchClassName } from '../music/pitches'
import { groupChordShapeRepeats, chordShapeFamilyId, soundingBass, type PlayableChordShape } from '../music/chordShapes'
import {
  collectAvailableInversions,
  createChordChoice,
  createPlayableChordForChoice,
  createPlayableShapesForChord,
  filterShapesByLowestString,
  LOWEST_STRING_OPTIONS,
  VOICE_LEADING_QUALITIES,
  updateChordChoice,
  updateChordChoiceAt,
  voicingLabel,
  voicingOptionsForQuality,
  type ChordChoice,
  type LowestString,
  type VoiceLeadingChoiceQuality,
  type VoiceLeadingVoicing,
} from '../music/voiceLeading'
import { displayNote } from '../presentation/notes'

const FRET_COUNT = 22
const ROOTS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']
const progression = (presetId: string, chords: readonly (readonly [string, VoiceLeadingChoiceQuality])[]) => (
  chords.map(([root, quality], index) => createChordChoice(`${presetId}-${index}`, root, quality))
)
const PRESETS: { label: string; chords: readonly ChordChoice[] }[] = [
  { label: 'C → F → G → C', chords: progression('preset-1', [['C', 'major'], ['F', 'major'], ['G', 'major'], ['C', 'major']]) },
  { label: 'C → G → Am → F', chords: progression('preset-2', [['C', 'major'], ['G', 'major'], ['A', 'minor'], ['F', 'major']]) },
  { label: 'Dm → G → C', chords: progression('preset-3', [['D', 'minor'], ['G', 'major'], ['C', 'major']]) },
]
const qualityLabel = (quality: VoiceLeadingChoiceQuality) => quality === 'major7' ? 'Major 7' : quality[0].toUpperCase() + quality.slice(1)
const STRING_NAMES = ['E', 'B', 'G', 'D', 'A', 'E']

const lowToHighStringOrder = (left: PlayableChordShape, right: PlayableChordShape) => (
  right.notes[0].string - left.notes[0].string
  || Math.min(...left.notes.map(note => note.fret)) - Math.min(...right.notes.map(note => note.fret))
  || Math.max(...left.notes.map(note => note.fret)) - Math.max(...right.notes.map(note => note.fret))
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

export function VoiceLeadingExplorer() {
  const [chords, setChords] = useState<ChordChoice[]>([...PRESETS[0].chords])
  const [transposeAmount, setTransposeAmount] = useState(2)
  const [lowestString, setLowestString] = useState<LowestString>(3)
  const [hiddenChords, setHiddenChords] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [hoveredId, setHoveredId] = useState<string>()
  const nextChordId = useRef(1)
  const progressionChords = useMemo(() => chords.map(createPlayableChordForChoice), [chords])
  const distinct = useMemo(() => [...new Map(progressionChords.map(chord => [chord.id, chord])).values()], [progressionChords])
  const colorIndexByChordId = useMemo(() => new Map(distinct.map((chord, index) => [chord.id, index])), [distinct])
  const generatedSlots = useMemo(() => chords.map((choice, index) => {
    const chord = progressionChords[index]
    const colorIndex = colorIndexByChordId.get(chord.id) ?? 0
    return {
      choice,
      chord,
      shapes: createPlayableShapesForChord(choice, { fretCount: FRET_COUNT })
        .map(shape => ({ ...shape, colorIndex })),
    }
  }), [chords, colorIndexByChordId, progressionChords])
  const displaySlots = useMemo(() => generatedSlots.map(slot => ({
    ...slot,
    shapes: filterShapesByLowestString(slot.shapes, lowestString),
  })), [generatedSlots, lowestString])
  const allShapes = useMemo(() => [...new Map(
    displaySlots.flatMap(slot => slot.shapes).map(shape => [shape.id, shape]),
  ).values()], [displaySlots])
  const inversionSections = useMemo(() => collectAvailableInversions(
    generatedSlots.map(slot => slot.shapes),
  ), [generatedSlots])
  const lowestStringLabel = LOWEST_STRING_OPTIONS.find(option => option.value === lowestString)?.label ?? ''
  const selected = selectedIds.flatMap(id => {
    const shape = allShapes.find(shape => chordShapeFamilyId(shape) === id)
    return shape ? [shape] : []
  })
  const visibleShapes = allShapes.filter(shape => !hiddenChords.includes(shape.chord.id))
  const hovered = visibleShapes.find(shape => chordShapeFamilyId(shape) === hoveredId)
  const active = hovered ?? selected[selected.length - 1]
  const inspection = active ? shapeInspection(active, allShapes.filter(shape => chordShapeFamilyId(shape) === chordShapeFamilyId(active))) : undefined
  const presetIndex = PRESETS.findIndex(preset => JSON.stringify(preset.chords) === JSON.stringify(chords))
  function resetSelection() { setSelectedIds([]); setHoveredId(undefined) }
  function toggleShape(shape: PlayableChordShape) {
    const id = chordShapeFamilyId(shape)
    setSelectedIds(current => current.includes(id) ? current.filter(selected => selected !== id) : [...current, id])
    // A click ends the preview too, so unpinning clears the board without moving the pointer.
    setHoveredId(undefined)
  }
  function updateProgression(next: ChordChoice[]) {
    setChords(next)
    setHiddenChords([])
    resetSelection()
  }
  function moveChord(index: number, nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= chords.length) return
    const next = [...chords]
    const [moved] = next.splice(index, 1)
    next.splice(nextIndex, 0, moved)
    updateProgression(next)
  }

  return <>
    <div className="intro progression-intro">
      <div><h1>Explore chord shapes.</h1><p>Choose each chord’s root, type, and voicing independently. Then explore the movement between shapes.</p></div>
    </div>
    <section className="voice-leading-controls" aria-label="Voice leading controls">
      <div className="voice-settings-toolbar">
        <label>Progression<select value={presetIndex < 0 ? 'custom' : presetIndex} onChange={event => {
          const preset = PRESETS[Number(event.target.value)]
          if (preset) updateProgression([...preset.chords])
        }}>
          {PRESETS.map((preset, index) => <option key={index} value={index}>{preset.label}</option>)}
          {presetIndex < 0 && <option value="custom">Custom progression</option>}
        </select></label>
        <label>Lowest string<select value={lowestString} onChange={event => { setLowestString(Number(event.target.value) as LowestString); resetSelection() }}>
          {LOWEST_STRING_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select></label>
        <div className="voice-transpose-controls">
          <label>Transpose all<select value={transposeAmount} onChange={event => setTransposeAmount(Number(event.target.value))}>
            {[
              'Half step (1 semitone)', 'Whole step (2 semitones)', 'Minor 3rd (3 semitones)',
              'Major 3rd (4 semitones)', 'Perfect 4th (5 semitones)', 'Tritone (6 semitones)',
              'Perfect 5th (7 semitones)', 'Minor 6th (8 semitones)', 'Major 6th (9 semitones)',
              'Minor 7th (10 semitones)', 'Major 7th (11 semitones)',
            ].map((label, index) => <option key={index + 1} value={index + 1}>{label}</option>)}
          </select></label>
          <div className="voice-transpose-buttons" aria-label="Transpose direction">
            <button type="button" onClick={() => updateProgression(chords.map(chord => updateChordChoice(chord, { root: transposePitchClassName(chord.root, -transposeAmount) })))}><ArrowIcon direction="down" />Down</button>
            <button type="button" onClick={() => updateProgression(chords.map(chord => updateChordChoice(chord, { root: transposePitchClassName(chord.root, transposeAmount) })))}><ArrowIcon direction="up" />Up</button>
          </div>
          <span>Shifts every chord together.</span>
        </div>
      </div>
      <div className="voice-progression-editor">
        <h2>Progression</h2>
        <ol className="voice-chord-fields">
          {chords.map((chord, index) => {
            const chordName = `${displayNote(chord.root)} ${qualityLabel(chord.quality)}`
            return <li className="voice-chord-item" key={chord.id}>
              <fieldset className="voice-chord-card">
                <legend className="sr-only">Chord {index + 1}: {chordName}</legend>
                <header>
                  <span className="voice-chord-number" aria-hidden="true">{index + 1}</span>
                  <strong>{chordName}</strong>
                  <button className="voice-chord-delete" type="button" title={`Remove chord ${index + 1}`} aria-label={`Remove chord ${index + 1}: ${chordName}`} disabled={chords.length <= 1}
                    onClick={() => updateProgression(chords.filter((_, slot) => slot !== index))}><TrashIcon /></button>
                </header>
                <div className="voice-chord-inputs">
                  <label>Root<select value={chord.root} onChange={event => updateProgression([...updateChordChoiceAt(chords, chord.id, { root: event.target.value })])}>
                    {ROOTS.map(root => <option key={root} value={root}>{displayNote(root)}</option>)}
                  </select></label>
                  <label>Type<select value={chord.quality} onChange={event => updateProgression([...updateChordChoiceAt(chords, chord.id, { quality: event.target.value as VoiceLeadingChoiceQuality })])}>
                    {VOICE_LEADING_QUALITIES.map(quality => <option key={quality} value={quality}>{qualityLabel(quality)}</option>)}
                  </select></label>
                  <label>Voicing<select value={chord.voicing} onChange={event => updateProgression([...updateChordChoiceAt(chords, chord.id, { voicing: event.target.value as VoiceLeadingVoicing })])}>
                    {voicingOptionsForQuality(chord.quality).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select></label>
                </div>
                <div className="voice-chord-actions" aria-label={`Reorder chord ${index + 1}`}>
                  <button type="button" title="Move chord left" aria-label={`Move chord ${index + 1} left`} disabled={index === 0} onClick={() => moveChord(index, index - 1)}><ArrowIcon direction="left" /></button>
                  <button type="button" title="Move chord right" aria-label={`Move chord ${index + 1} right`} disabled={index === chords.length - 1} onClick={() => moveChord(index, index + 1)}><ArrowIcon direction="right" /></button>
                </div>
              </fieldset>
              <span className="voice-sequence-arrow" aria-hidden="true"><ArrowIcon direction="right" /></span>
            </li>
          })}
          <li className="voice-add-item">
            <button className="voice-add-chord" type="button" disabled={chords.length >= 8} onClick={() => updateProgression([...chords, createChordChoice(`added-${nextChordId.current++}`, 'C', 'major')])}>
              <span><PlusIcon /></span>Add chord
            </button>
          </li>
        </ol>
      </div>
    </section>
    <section className="voice-leading-map" aria-labelledby="voice-map-heading">
      <div className="section-heading"><h2 id="voice-map-heading">Available shapes</h2><span>{visibleShapes.length} fretboard positions · frets 0–22</span></div>
      <div className="voice-chord-strip" role="group" aria-label="Chord visibility">
        <button type="button" aria-pressed={hiddenChords.length === 0} onClick={() => { setHiddenChords([]); setHoveredId(undefined) }}>All chords</button>
        {progressionChords.map((triad, index) => <Fragment key={chords[index].id}>
          {index > 0 && <span aria-hidden="true">→</span>}
          <button type="button" aria-pressed={!hiddenChords.includes(triad.id)} style={{ '--shape-color': PROGRESSION_STEP_COLORS[distinct.findIndex(chord => chord.id === triad.id) % PROGRESSION_STEP_COLORS.length] } as CSSProperties}
            onClick={() => { setHiddenChords(current => current.includes(triad.id) ? current.filter(hidden => hidden !== triad.id) : [...current, triad.id]); setHoveredId(undefined) }}>
            <strong>{displayNote(triad.root.name)}</strong><small>{triad.quality === 'major7' ? 'Major 7' : triad.quality}</small>
          </button>
        </Fragment>)}
      </div>
      <p className="voice-map-help">Colors identify chords without repeating chord names across the fretboard. Hover or select a shape to reveal its actual notes and intervals. Click shapes or cards to pin several; click again to unpin. Pinned shapes stay on the board; dotted rings mark the same string and fret in another chord.</p>
      <div className="voice-selection" role="status">
        <div className="voice-inspection" style={{ '--shape-color': active ? shapeColor(active) : 'var(--line)' } as CSSProperties}>
          <div className="voice-inspection-heading">
            <strong>{inspection?.title ?? 'Hover or select a shape to inspect it.'}</strong>
            {inspection && <span className="voice-inspection-notes">{inspection.notes}</span>}
          </div>
          <div className="voice-inspection-location">
            <span>{inspection?.location}</span>
          </div>
          <div className="voice-inspection-form">{inspection?.cagedLabel}</div>
          <small>{selected.length > 0 ? `${selected.length} pinned ${selected.length === 1 ? 'shape' : 'shapes'}` : ''}</small>
        </div>
        <button type="button" onClick={resetSelection} style={{ visibility: selected.length > 0 ? 'visible' : 'hidden' }} disabled={selected.length === 0}>Clear all selections</button>
      </div>
      {allShapes.length === 0
        ? <p className="voice-map-help">{lowestString === 0 ? 'No voicings were found in the current progression.' : `No voicing available with ${lowestStringLabel} as the lowest string.`}</p>
        : visibleShapes.length === 0 && <p className="voice-map-help">No chords enabled. Toggle a chord above or choose All chords.{selected.length > 0 ? ' Your pinned shapes are still shown.' : ''}</p>}
      <ChordShapeFretboard allShapes={allShapes} shapes={visibleShapes} selected={selected} hovered={hovered} fretCount={FRET_COUNT}
        onHover={shape => setHoveredId(shape ? chordShapeFamilyId(shape) : undefined)} onSelect={toggleShape} />
      <div className="fretboard-caption">
        <p>Per-chord voicings · skipped strings are muted · standard tuning</p>
        <p>Inversion and lowest-string filtering follow the actual sounding bass.</p>
      </div>
      <div className="voice-shape-catalog voice-shape-grid" style={{ '--inversion-columns': inversionSections.length } as CSSProperties} aria-label="Select any available shape">
        {inversionSections.map(inversion => {
          const visibleSlots = generatedSlots.filter(slot => (
            !hiddenChords.includes(slot.chord.id)
            && slot.shapes.some(shape => shape.inversion.index === inversion.index)
          ))
          const roleOrder = `${['Root', 'Third', 'Fifth', 'Seventh'][inversion.index]} in bass`
          return <section className="voice-inversion-group" key={inversion.index} aria-labelledby={`catalog-inversion-${inversion.index}`}>
            <header><h3 id={`catalog-inversion-${inversion.index}`}>{inversion.name}</h3><small>{roleOrder}</small></header>
            {visibleSlots.map(slot => {
              const shapes = (displaySlots.find(candidate => candidate.choice.id === slot.choice.id)?.shapes ?? [])
                .filter(shape => shape.inversion.index === inversion.index)
                .sort(lowToHighStringOrder)
              const repeatGroups = groupChordShapeRepeats(shapes)
              const slotName = `${displayNote(slot.choice.root)} ${qualityLabel(slot.choice.quality)}`
              return <details key={slot.choice.id} open>
                <summary>{slotName} · {voicingLabel(slot.choice.voicing)} · {shapes.length} fretboard positions</summary>
                <div className="voice-inversion-list">{repeatGroups.length === 0
                  ? <p className="voice-inversion-empty">{lowestString === 0 ? 'No shape in this inversion.' : `No voicing available with ${lowestStringLabel} as the lowest string.`}</p>
                  : repeatGroups.map(repeats => {
                const shape = repeats[0]
                const bass = soundingBass(shape)
                return <button key={shape.id} type="button"
                  data-hovered={hoveredId === chordShapeFamilyId(shape) ? 'true' : undefined}
                  style={{ '--shape-color': shapeColor(shape) } as CSSProperties} aria-pressed={selectedIds.includes(chordShapeFamilyId(shape))}
                  onMouseEnter={() => setHoveredId(chordShapeFamilyId(shape))} onMouseLeave={() => setHoveredId(undefined)}
                  onFocus={() => setHoveredId(chordShapeFamilyId(shape))} onBlur={() => setHoveredId(undefined)}
                  onClick={() => toggleShape(shape)}>
                  <strong>{STRING_NAMES[bass.string - 1]} ({bass.string}): {repeats.map(repeat => fretLabel(soundingBass(repeat).fret)).join(' / ')}</strong>
                  <small>{shapeCagedLabel(shape) || 'Major 7 voicing'}</small>
                </button>
                })}</div>
              </details>
            })}
          </section>
        })}
      </div>
    </section>
    <footer className="page-footer">Voice Leading<span>Recognize shapes. Find common ground.</span></footer>
  </>
}
