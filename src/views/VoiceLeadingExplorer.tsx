import { Fragment, useMemo, useState, type CSSProperties } from 'react'
import { classifyCagedForm } from '../music/cagedPositions'
import { PROGRESSION_STEP_COLORS } from '../components/ProgressionPathView'
import { fretLabel, shapeCagedLabel, shapeColor, shapeInspection, ChordShapeFretboard } from '../components/ChordShapeFretboard'
import { transposePitchClassName } from '../music/pitches'
import { createSpreadTriadShapes } from '../music/spreadTriadShapes'
import { createTriadShapesOnStrings } from '../music/triadShapes'
import { fromTriadShape, groupChordShapeRepeats, chordShapeFamilyId, soundingBass, type PlayableChordShape, type VoiceLeadingQuality } from '../music/chordShapes'
import { createMajorSeventh, createMajorSeventhShapes } from '../music/majorSeventhShapes'
import { createTriad } from '../music/triads'
import { TRIAD_VOICING_PATTERNS, type VoicingLayout } from '../music/voicingPatterns'
import { displayNote } from '../presentation/notes'

const FRET_COUNT = 22
const ROOTS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']
const QUALITIES: VoiceLeadingQuality[] = ['major', 'minor', 'diminished', 'augmented', 'major7']
interface ChordChoice { root: string; quality: VoiceLeadingQuality }
const PRESETS: { label: string; chords: ChordChoice[] }[] = [
  { label: 'C → F → G → C', chords: ['C', 'F', 'G', 'C'].map(root => ({ root, quality: 'major' })) },
  { label: 'C → G → Am → F', chords: [{ root: 'C', quality: 'major' }, { root: 'G', quality: 'major' }, { root: 'A', quality: 'minor' }, { root: 'F', quality: 'major' }] },
  { label: 'Dm → G → C', chords: [{ root: 'D', quality: 'minor' }, { root: 'G', quality: 'major' }, { root: 'C', quality: 'major' }] },
]
const qualityLabel = (quality: VoiceLeadingQuality) => quality === 'major7' ? 'Major 7' : quality[0].toUpperCase() + quality.slice(1)
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
  const [chords, setChords] = useState<ChordChoice[]>(PRESETS[0].chords)
  const [transposeAmount, setTransposeAmount] = useState(2)
  const [voicingLayout, setVoicingLayout] = useState<VoicingLayout>('closed')
  const [bassString, setBassString] = useState(3)
  const [hiddenChords, setHiddenChords] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [hoveredId, setHoveredId] = useState<string>()
  const progressionChords = useMemo(() => chords.map(chord => chord.quality === 'major7' ? createMajorSeventh(chord.root) : createTriad(chord.root, chord.quality)), [chords])
  const distinct = useMemo(() => [...new Map(progressionChords.map(triad => [triad.id, triad])).values()], [progressionChords])
  const hasMajor7 = chords.some(chord => chord.quality === 'major7')
  const allShapes = useMemo(() => distinct.flatMap((triad, colorIndex): PlayableChordShape[] => {
    if (triad.quality === 'major7') return createMajorSeventhShapes(triad, { fretCount: FRET_COUNT })
      .filter(shape => bassString === 0 || soundingBass(shape).string === bassString)
      .map(shape => ({ ...shape, colorIndex }))
    const shapes = voicingLayout === 'closed'
      ? (bassString === 0 ? [1, 2, 3, 4] : [bassString - 2]).flatMap(start => (
          createTriadShapesOnStrings(triad, [start, start + 1, start + 2], undefined, FRET_COUNT)
        ))
      : createSpreadTriadShapes(triad, { fretCount: FRET_COUNT })
    return shapes.filter(shape => bassString === 0 || shape.notes[shape.notes.length - 1].string === bassString)
      .map(shape => ({ ...fromTriadShape(shape), colorIndex, cagedForm: shape.cagedPosition?.form ?? classifyCagedForm(triad, shape.notes) }))
  }), [bassString, distinct, voicingLayout])
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
    if (bassString === 3 && next.some(chord => chord.quality === 'major7')) setBassString(0)
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
      <div><h1>Explore chord shapes.</h1><p>Choose each chord’s root and type independently. Then explore the movement between shapes.</p></div>
    </div>
    <section className="voice-leading-controls" aria-label="Voice leading controls">
      <div className="voice-settings-toolbar">
        <label>Progression<select value={presetIndex < 0 ? 'custom' : presetIndex} onChange={event => updateProgression(PRESETS[Number(event.target.value)].chords)}>
          {PRESETS.map((preset, index) => <option key={index} value={index}>{preset.label}</option>)}
          {presetIndex < 0 && <option value="custom">Custom progression</option>}
        </select></label>
        <label>{hasMajor7 ? 'Triad voicing' : 'Voicing'}<select value={voicingLayout} onChange={event => {
          const layout = event.target.value as VoicingLayout
          setVoicingLayout(layout)
          if (layout === 'spread' && bassString === 3) setBassString(0)
          resetSelection()
        }}>
          <option value="closed">Closed</option>
          <option value="spread">Spread</option>
        </select></label>
        <label>Bass note<select value={bassString} onChange={event => { setBassString(Number(event.target.value)); resetSelection() }}>
          <option value={0}>All</option>
          {(voicingLayout === 'closed' && !hasMajor7 ? [6, 5, 4, 3] : [6, 5, 4]).map(string => (
            <option key={string} value={string}>{STRING_NAMES[string - 1]} string ({string})</option>
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
            <button type="button" onClick={() => updateProgression(chords.map(chord => ({ ...chord, root: transposePitchClassName(chord.root, -transposeAmount) })))}><ArrowIcon direction="down" />Down</button>
            <button type="button" onClick={() => updateProgression(chords.map(chord => ({ ...chord, root: transposePitchClassName(chord.root, transposeAmount) })))}><ArrowIcon direction="up" />Up</button>
          </div>
          <span>Shifts every chord together.</span>
        </div>
      </div>
      <div className="voice-progression-editor">
        <h2>Progression</h2>
        <ol className="voice-chord-fields">
          {chords.map((chord, index) => {
            const chordName = `${displayNote(chord.root)} ${qualityLabel(chord.quality)}`
            return <li className="voice-chord-item" key={index}>
              <fieldset className="voice-chord-card">
                <legend className="sr-only">Chord {index + 1}: {chordName}</legend>
                <header>
                  <span className="voice-chord-number" aria-hidden="true">{index + 1}</span>
                  <strong>{chordName}</strong>
                  <button className="voice-chord-delete" type="button" title={`Remove chord ${index + 1}`} aria-label={`Remove chord ${index + 1}: ${chordName}`} disabled={chords.length <= 1}
                    onClick={() => updateProgression(chords.filter((_, slot) => slot !== index))}><TrashIcon /></button>
                </header>
                <div className="voice-chord-inputs">
                  <label>Root<select value={chord.root} onChange={event => updateProgression(chords.map((old, slot) => slot === index ? { ...old, root: event.target.value } : old))}>
                    {ROOTS.map(root => <option key={root} value={root}>{displayNote(root)}</option>)}
                  </select></label>
                  <label>Type<select value={chord.quality} onChange={event => updateProgression(chords.map((old, slot) => slot === index ? { ...old, quality: event.target.value as VoiceLeadingQuality } : old))}>
                    {QUALITIES.map(quality => <option key={quality} value={quality}>{qualityLabel(quality)}</option>)}
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
            <button className="voice-add-chord" type="button" disabled={chords.length >= 8} onClick={() => updateProgression([...chords, { root: 'C', quality: 'major' }])}>
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
        {progressionChords.map((triad, index) => <Fragment key={index}>
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
        ? <p className="voice-map-help">No voicings were found for this bass string in the current progression.</p>
        : visibleShapes.length === 0 && <p className="voice-map-help">No chords enabled. Toggle a chord above or choose All chords.{selected.length > 0 ? ' Your pinned shapes are still shown.' : ''}</p>}
      <ChordShapeFretboard allShapes={allShapes} shapes={visibleShapes} selected={selected} hovered={hovered} fretCount={FRET_COUNT}
        onHover={shape => setHoveredId(shape ? chordShapeFamilyId(shape) : undefined)} onSelect={toggleShape} />
      <div className="fretboard-caption">{hasMajor7
        ? <><p>Curated Major 7 shapes · skipped strings are muted · standard tuning</p><p>Closed/Spread applies to triads. Inversion follows the sounding bass.</p></>
        : voicingLayout === 'closed'
        ? <><p>Three adjacent strings per shape · standard tuning</p><p>Close-position triads · octave repeats highlight together.</p></>
        : <><p>Skipped strings allowed · standard tuning</p><p>Spread triads · ergonomic CAGED-position voicings.</p></>}
      </div>
      <div className="voice-shape-catalog voice-shape-grid" style={{ '--inversion-columns': hasMajor7 ? 4 : 3 } as CSSProperties} aria-label="Select any available shape">
        {[...TRIAD_VOICING_PATTERNS[voicingLayout], ...(hasMajor7 ? [{ id: 'seventh-third', inversion: { index: 3, name: 'Third inversion' }, bassToTop: [] }] : [])].map(pattern => {
          const visibleChords = distinct.filter(chord => !hiddenChords.includes(chord.id) && (pattern.inversion.index < 3 || chord.quality === 'major7'))
          // Role names remain accurate when major, minor and altered chords share a column.
          const roleOrder = hasMajor7 ? `${['Root', 'Third', 'Fifth', 'Seventh'][pattern.inversion.index]} in bass` : pattern.bassToTop.map(role => ({ root: 'Root', third: 'Third', fifth: 'Fifth' })[role]).join(' → ')
          return <section className="voice-inversion-group" key={pattern.id} aria-labelledby={`catalog-${pattern.id}`}>
            <header><h3 id={`catalog-${pattern.id}`}>{pattern.inversion.name}</h3><small>{roleOrder}</small></header>
            {visibleChords.map(triad => {
              const shapes = visibleShapes.filter(shape => shape.chord.id === triad.id && shape.inversion.index === pattern.inversion.index).sort(lowToHighStringOrder)
              const repeatGroups = groupChordShapeRepeats(shapes)
              return <details key={triad.id} open>
                <summary>{displayNote(triad.chordName)} · {shapes.length} fretboard positions</summary>
                <div className="voice-inversion-list">{repeatGroups.length === 0
                  ? <p className="voice-inversion-empty">No shape in this position.</p>
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
