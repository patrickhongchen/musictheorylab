import { Fragment, useMemo, useState, type CSSProperties } from 'react'
import { PROGRESSION_STEP_COLORS } from '../components/ProgressionPathView'
import { shapeColor, shapeSummary, TriadShapeFretboard } from '../components/TriadShapeFretboard'
import { createTriadShapesOnStrings, groupTriadShapeRepeats, triadShapeFamilyId } from '../music/triadShapes'
import { createTriad } from '../music/triads'
import type { ChordQuality } from '../music/types'
import { chordIntervalLabel, displayNote } from '../presentation/notes'

const FRET_COUNT = 22
const ROOTS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']
const QUALITIES: ChordQuality[] = ['major', 'minor', 'diminished', 'augmented']
interface ChordChoice { root: string; quality: ChordQuality }
const PRESETS: { label: string; chords: ChordChoice[] }[] = [
  { label: 'C → F → G → C', chords: ['C', 'F', 'G', 'C'].map(root => ({ root, quality: 'major' })) },
  { label: 'C → G → Am → F', chords: [{ root: 'C', quality: 'major' }, { root: 'G', quality: 'major' }, { root: 'A', quality: 'minor' }, { root: 'F', quality: 'major' }] },
  { label: 'Dm → G → C', chords: [{ root: 'D', quality: 'minor' }, { root: 'G', quality: 'major' }, { root: 'C', quality: 'major' }] },
]
const INVERSION_GROUPS = [
  { index: 0, name: 'Root position', order: 'root → third → fifth' },
  { index: 1, name: 'First inversion', order: 'third → fifth → root' },
  { index: 2, name: 'Second inversion', order: 'fifth → root → third' },
] as const

const STRING_NAMES = ['E', 'B', 'G', 'D', 'A', 'E']
function fretLabel(fret: number) {
  if (fret === 0) return 'open'
  const suffix = fret % 100 >= 11 && fret % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[fret % 10] ?? 'th')
  return `${fret}${suffix} fret`
}
const lowToHighStringOrder = (left: ReturnType<typeof createTriadShapesOnStrings>[number], right: ReturnType<typeof createTriadShapesOnStrings>[number]) => (
  right.notes[0].string - left.notes[0].string
  || Math.min(...left.notes.map(note => note.fret)) - Math.min(...right.notes.map(note => note.fret))
  || Math.max(...left.notes.map(note => note.fret)) - Math.max(...right.notes.map(note => note.fret))
)

export function VoiceLeadingExplorer() {
  const [chords, setChords] = useState<ChordChoice[]>(PRESETS[0].chords)
  const [stringStart, setStringStart] = useState(1)
  const [hiddenChords, setHiddenChords] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string>()
  const [hoveredId, setHoveredId] = useState<string>()
  const triads = useMemo(() => chords.map(chord => createTriad(chord.root, chord.quality)), [chords])
  const distinct = useMemo(() => [...new Map(triads.map(triad => [triad.id, triad])).values()], [triads])
  const allShapes = useMemo(() => distinct.flatMap((triad, colorIndex) => (
    (stringStart === 0 ? [1, 2, 3, 4] : [stringStart]).flatMap(start => (
      createTriadShapesOnStrings(triad, [start, start + 1, start + 2], undefined, FRET_COUNT).map(shape => ({ ...shape, colorIndex }))
    ))
  )), [distinct, stringStart])
  const selected = allShapes.find(shape => triadShapeFamilyId(shape) === selectedId)
  const visibleShapes = allShapes.filter(shape => !hiddenChords.includes(shape.triad.id))
  const hovered = visibleShapes.find(shape => triadShapeFamilyId(shape) === hoveredId)
  const active = hovered ?? selected
  const presetIndex = PRESETS.findIndex(preset => JSON.stringify(preset.chords) === JSON.stringify(chords))
  function resetSelection() { setSelectedId(undefined); setHoveredId(undefined) }
  function updateProgression(next: ChordChoice[]) { setChords(next); setHiddenChords([]); resetSelection() }

  return <>
    <div className="intro progression-intro">
      <div><h1>Explore every triad shape.</h1><p>Choose each chord’s root and type independently. Then explore the movement between shapes.</p></div>
    </div>
    <section className="voice-leading-controls" aria-label="Voice leading controls">
      <label>Progression<select value={presetIndex < 0 ? 'custom' : presetIndex} onChange={event => updateProgression(PRESETS[Number(event.target.value)].chords)}>
        {PRESETS.map((preset, index) => <option key={index} value={index}>{preset.label}</option>)}
        {presetIndex < 0 && <option value="custom">Custom progression</option>}
      </select></label>
      <label>String range<select value={stringStart} onChange={event => { setStringStart(Number(event.target.value)); resetSelection() }}>
        <option value={0}>All · four three-string groups</option>
        {[1, 2, 3, 4].map(start => <option key={start} value={start}>Strings {start}–{start + 2}</option>)}
      </select></label>
      <div className="voice-progression-editor">
        <div>{chords.map((chord, index) => <fieldset key={index}>
          <legend>Chord {index + 1}</legend>
          <label>Root<select value={chord.root} onChange={event => updateProgression(chords.map((old, slot) => slot === index ? { ...old, root: event.target.value } : old))}>
            {ROOTS.map(root => <option key={root} value={root}>{displayNote(root)}</option>)}
          </select></label>
          <label>Type<select value={chord.quality} onChange={event => updateProgression(chords.map((old, slot) => slot === index ? { ...old, quality: event.target.value as ChordQuality } : old))}>
            {QUALITIES.map(quality => <option key={quality} value={quality}>{quality[0].toUpperCase() + quality.slice(1)}</option>)}
          </select></label>
        </fieldset>)}</div>
        <button type="button" disabled={chords.length >= 8} onClick={() => updateProgression([...chords, { root: 'C', quality: 'major' }])}>Add chord</button>
        <button type="button" disabled={chords.length <= 1} onClick={() => updateProgression(chords.slice(0, -1))}>Remove last chord</button>
      </div>
    </section>
    <section className="voice-leading-map" aria-labelledby="voice-map-heading">
      <div className="section-heading"><h2 id="voice-map-heading">Available shapes</h2><span>{visibleShapes.length} fretboard positions · frets 0–22</span></div>
      <div className="voice-chord-strip" role="group" aria-label="Chord visibility">
        <button type="button" aria-pressed={hiddenChords.length === 0} onClick={() => { setHiddenChords([]); setHoveredId(undefined) }}>All chords</button>
        {triads.map((triad, index) => <Fragment key={index}>
          {index > 0 && <span aria-hidden="true">→</span>}
          <button type="button" aria-pressed={!hiddenChords.includes(triad.id)} style={{ '--shape-color': PROGRESSION_STEP_COLORS[distinct.findIndex(chord => chord.id === triad.id) % PROGRESSION_STEP_COLORS.length] } as CSSProperties}
            onClick={() => { setHiddenChords(current => current.includes(triad.id) ? current.filter(hidden => hidden !== triad.id) : [...current, triad.id]); setHoveredId(undefined) }}>
            <strong>{displayNote(triad.root.name)}</strong><small>{triad.quality}</small>
          </button>
        </Fragment>)}
      </div>
      <p className="voice-map-help">Toggle chords above to show any combination. Select a shape to compare it with the visible chords. Your selected shape stays on the board; dotted rings mark the same string and fret in another chord.</p>
      <div className="voice-selection" role="status">
        <div><strong>{active ? shapeSummary(active) : 'Hover or select a connected shape to inspect its inversion.'}</strong>
          {selected && <small>Pinned: {shapeSummary(selected)}</small>}</div>
        {selected && <button type="button" onClick={resetSelection}>Clear selection</button>}
      </div>
      {visibleShapes.length === 0 && <p className="voice-map-help">No chords enabled. Toggle a chord above or choose All chords.{selected ? ' Your pinned shape is still shown.' : ''}</p>}
      <TriadShapeFretboard allShapes={allShapes} shapes={visibleShapes} selected={selected} hovered={hovered} fretCount={FRET_COUNT}
        onHover={shape => setHoveredId(shape ? triadShapeFamilyId(shape) : undefined)} onSelect={shape => setSelectedId(triadShapeFamilyId(shape))} />
      <div className="fretboard-caption"><p>Three adjacent strings per shape · standard tuning</p><p>Close-position triads only · octave repeats highlight together.</p></div>
      <div className="voice-inversion-guide">
        <strong>Three inversions, repeated along the neck</strong>
        <p>Each card groups the same shape across octaves and lists its root positions. The lowest sounding note—the bass—sets the inversion: root position is root → third → fifth; first inversion is third → fifth → root; second inversion is fifth → root → third.</p>
      </div>
      <div className="voice-shape-catalog" aria-label="Select any available shape">
        {distinct.filter(triad => !hiddenChords.includes(triad.id)).map(triad => <details key={triad.id} open>
          <summary>{displayNote(triad.chordName)} · {visibleShapes.filter(shape => shape.triad.id === triad.id).length} fretboard positions</summary>
          <div className="voice-shape-grid">{INVERSION_GROUPS.map(group => {
            const shapes = visibleShapes.filter(shape => shape.triad.id === triad.id && shape.inversion.index === group.index).sort(lowToHighStringOrder)
            const roleOrder = group.order.split(' → ').map(role => chordIntervalLabel(role as 'root' | 'third' | 'fifth', triad.quality)).join(' → ')
            return <section className="voice-inversion-group" key={group.index} aria-label={`${group.name}, ${shapes.length} positions`}>
              <header><strong>{group.name}</strong><small>Bass → top · {roleOrder}</small></header>
              <div className="voice-inversion-list">{groupTriadShapeRepeats(shapes).map(repeats => {
                const shape = repeats[0]
                const root = shape.notes.find(note => note.tone.role === 'root')!
                return <button key={shape.id} type="button"
                  style={{ '--shape-color': shapeColor(shape) } as CSSProperties} aria-pressed={selectedId === triadShapeFamilyId(shape)}
                  onMouseEnter={() => setHoveredId(triadShapeFamilyId(shape))} onMouseLeave={() => setHoveredId(undefined)}
                  onFocus={() => setHoveredId(triadShapeFamilyId(shape))} onBlur={() => setHoveredId(undefined)}
                  onClick={() => setSelectedId(triadShapeFamilyId(shape))}>
                  <strong>{STRING_NAMES[root.string - 1]} ({root.string}): {repeats.map(repeat => fretLabel(repeat.notes.find(note => note.tone.role === 'root')!.fret)).join(' / ')}</strong>
                </button>
              })}</div>
            </section>
          })}</div>
        </details>)}
      </div>
    </section>
    <footer className="page-footer">Voice Leading<span>Recognize shapes. Find common ground.</span></footer>
  </>
}
