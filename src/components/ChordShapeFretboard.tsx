import { STANDARD_TUNING } from '../music/fretboard'
import { chordShapeFamilyId, soundingBass, type PlayableChordShape } from '../music/chordShapes'
import { chordIntervalLabel, displayNote } from '../presentation/notes'
import { PROGRESSION_STEP_COLORS } from './ProgressionPathView'

export function shapeCagedLabel(shape: PlayableChordShape): string {
  const primary = shape.cagedForm ?? shape.cagedPosition?.form
  const regions = [...new Set(shape.compatibleCagedRegions?.map(region => region.form))]
  if (primary) return `${primary}-shape`
  if (!regions.length) return ''
  const complete = shape.compatibleCagedRegions?.some(region => region.matchedNotes.length === shape.notes.length)
  return `${regions.join(' / ')}${regions.length === 1 ? '-shape' : complete ? ' shapes' : ' combination'}`
}

export const shapeColor = (shape: PlayableChordShape) => PROGRESSION_STEP_COLORS[(shape.colorIndex ?? 0) % PROGRESSION_STEP_COLORS.length]
export function fretLabel(fret: number) {
  if (fret === 0) return 'open'
  const suffix = fret % 100 >= 11 && fret % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[fret % 10] ?? 'th')
  return `${fret}${suffix} fret`
}
export const shapeInspection = (shape: PlayableChordShape, repeats: readonly PlayableChordShape[]) => {
  const bass = soundingBass(shape)
  const stringName = STANDARD_TUNING[STANDARD_TUNING.length - bass.string].name
  const frets = [...new Set(repeats.map(repeat => soundingBass(repeat).fret))].sort((a, b) => a - b)
  return {
    title: `${displayNote(shape.chord.chordName)} · ${shape.inversion.name}`,
    location: `${stringName} (${bass.string}): ${frets.map(fretLabel).join(' / ')}`,
    cagedLabel: shapeCagedLabel(shape),
    form: shape.cagedForm ?? shape.cagedPosition?.form,
    notes: [...shape.notes].reverse().map(note => `${displayNote(note.tone.pitchClass.name)}${shape.chord.quality === 'major7' ? ` (${chordIntervalLabel(note.tone.role, shape.chord.quality)})` : ''}`).join(' → '),
  }
}

const positionKey = (note: PlayableChordShape['notes'][number]) => `${note.string}:${note.fret}`

interface Props {
  allShapes: readonly PlayableChordShape[]
  shapes: readonly PlayableChordShape[]
  selected: readonly PlayableChordShape[]
  hovered: PlayableChordShape | undefined
  onHover: (shape: PlayableChordShape | undefined) => void
  onSelect: (shape: PlayableChordShape) => void
  fretCount: number
}

export function ChordShapeFretboard({ allShapes, shapes, selected, hovered, onHover, onSelect, fretCount }: Props) {
  const nut = 102
  const step = 70
  const end = nut + fretCount * step
  const fretX = (fret: number) => fret === 0 ? 73 : nut + (fret - 0.5) * step
  const stringY = (string: number) => 48 + (string - 1) * 46
  const selectedFamilyIds = new Set(selected.map(chordShapeFamilyId))
  const selectedRepeats = allShapes.filter(shape => selectedFamilyIds.has(chordShapeFamilyId(shape)))
  const hoveredRepeats = hovered ? shapes.filter(shape => chordShapeFamilyId(shape) === chordShapeFamilyId(hovered)) : []
  const selectedPositions = new Map<string, Set<string>>()
  for (const shape of selectedRepeats) {
    for (const note of shape.notes) {
      const key = positionKey(note)
      const chords = selectedPositions.get(key) ?? new Set<string>()
      chords.add(shape.chord.id)
      selectedPositions.set(key, chords)
    }
  }
  const active = hovered !== undefined || selected.length > 0
  const visible = [...shapes, ...selectedRepeats.filter(repeat => !shapes.some(shape => shape.id === repeat.id))]
  const hoveredFamilyId = hovered ? chordShapeFamilyId(hovered) : undefined
  const renderShape = (shape: PlayableChordShape, overlay = false, showDetails = overlay) => {
    const emphasized = overlay
    const color = shapeColor(shape)
    const points = shape.notes.map(note => `${fretX(note.fret)},${stringY(note.string)}`).join(' ')
    return <g key={`${shape.id}-${overlay}`} className="triad-map-shape"
      opacity={emphasized ? 1 : active ? 0.6 : 0.8}
      pointerEvents={overlay ? 'none' : undefined}
      onMouseEnter={overlay ? undefined : () => onHover(shape)}
      onMouseLeave={overlay ? undefined : () => onHover(undefined)}
      onClick={overlay ? undefined : () => onSelect(shape)}>
      {emphasized && <polyline points={points} fill="none" stroke="#faf9f6" strokeWidth="11" strokeLinejoin="round" />}
      <polyline points={points} fill="none" stroke={color} strokeWidth={emphasized ? 4 : 2} strokeLinejoin="round" />
      {!overlay && <polyline points={points} fill="none" stroke="transparent" strokeWidth="14" />}
      {shape.notes.map(note => {
        const shared = [...(selectedPositions.get(positionKey(note)) ?? [])].some(chordId => chordId !== shape.chord.id)
        return <g key={note.string} transform={`translate(${fretX(note.fret)}, ${stringY(note.string)})`}>
          {shared && <circle r="20" fill="none" stroke="#252925" strokeWidth="2" strokeDasharray="3 3" />}
          <circle r={emphasized ? 16 : 9} fill={emphasized ? color : '#faf9f6'} stroke={color} strokeWidth="2" />
          {showDetails && <>
            <text textAnchor="middle" y="4" fill="white" fontSize="11" fontWeight="700">{chordIntervalLabel(note.tone.role, shape.chord.quality)}</text>
            <text x="0" y="-22" textAnchor="middle" fill={color} fontSize="10" fontWeight="700" stroke="#faf9f6" strokeWidth="3" paintOrder="stroke">
              {displayNote(note.tone.pitchClass.name)}
            </text>
          </>}
        </g>
      })}
    </g>
  }
  return <div className="fretboard-scroll" tabIndex={0} role="region" aria-label="Chord shape fretboard, scroll horizontally to fret 22">
    <svg className="fretboard triad-shape-board" style={{ minWidth: end + 24 }} viewBox={`0 0 ${end + 24} 322`} role="img" aria-label="All visible chord shapes. Colors identify chords. High E is at the top. Select a shape to reveal its notes and intervals.">
      <rect x={nut} y="48" width={end - nut} height="230" fill="#f3f1eb" />
      {[3, 5, 7, 9, 12, 15, 17, 19, 21].filter(fret => fret <= fretCount).map(fret => <circle key={fret} cx={fretX(fret)} cy="163" r="4" fill="#d3d1c7" />)}
      {Array.from({ length: fretCount + 1 }, (_, fret) => <g key={fret}>
        {fret > 0 && <line x1={nut + fret * step} x2={nut + fret * step} y1="48" y2="278" stroke="#c6c7bd" />}
        <text x={fretX(fret)} y="310" textAnchor="middle" className="fret-label">{fret}</text>
      </g>)}
      {[...STANDARD_TUNING].reverse().map((note, index) => <g key={note.scientific}>
        <line x1="55" x2={end} y1={stringY(index + 1)} y2={stringY(index + 1)} stroke="#a6a99f" strokeWidth={0.8 + index * 0.2} />
        <text x="9" y={stringY(index + 1) + 5} className="string-label">{displayNote(note.name)}<tspan dx="5" className="string-number">({index + 1})</tspan></text>
      </g>)}
      <line x1={nut} x2={nut} y1="46" y2="280" stroke="#464c42" strokeWidth="5" />
      {visible.map(shape => renderShape(shape))}
      {selectedRepeats.map(shape => renderShape(shape, true, !hoveredFamilyId || hoveredFamilyId === chordShapeFamilyId(shape)))}
      {hoveredRepeats.filter(shape => !selectedRepeats.some(repeat => repeat.id === shape.id)).map(shape => renderShape(shape, true))}
    </svg>
  </div>
}
