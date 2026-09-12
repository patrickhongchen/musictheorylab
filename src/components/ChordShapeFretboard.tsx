import { STANDARD_TUNING } from '../music/fretboard'
import { chordShapeFamilyId, soundingBass, type PlayableChordShape } from '../music/chordShapes'
import { chordIntervalLabel, displayNote } from '../presentation/notes'
import { FretboardCanvas, FretboardGrid } from './fretboard/FretboardCanvas'
import { createFretboardGeometry } from './fretboard/fretboardGeometry'
import { PROGRESSION_STEP_COLORS } from './ProgressionPathView'

export function shapeCagedLabel(shape: PlayableChordShape): string {
  if (shape.cagedForms.length === 0) return ''
  return `${shape.cagedForms.join(' / ')}${shape.cagedForms.length === 1 ? '-shape' : ' combination'}`
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
  const geometry = createFretboardGeometry({
    fretCount,
    stringCount: STANDARD_TUNING.length,
    boardTop: 48,
    stringSpacing: 46,
    bottomPadding: 12,
    nutOverhang: 2,
    octaveDots: 'single',
  })
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
    const points = shape.notes.map(note => `${geometry.fretX(note.fret)},${geometry.stringY(note.string)}`).join(' ')
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
        return <g key={note.string} transform={`translate(${geometry.fretX(note.fret)}, ${geometry.stringY(note.string)})`}>
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
  return <FretboardCanvas
    geometry={geometry}
    scrollLabel="Chord shape fretboard, scroll horizontally to fret 22"
    svgProps={{
      className: 'fretboard',
      'aria-label': 'All visible chord shapes. Colors identify chords. High E is at the top. Select a shape to reveal its notes and intervals.',
    }}
  >
      <FretboardGrid geometry={geometry} tuning={STANDARD_TUNING} />
      {visible.map(shape => renderShape(shape))}
      {selectedRepeats.map(shape => renderShape(shape, true, !hoveredFamilyId || hoveredFamilyId === chordShapeFamilyId(shape)))}
      {hoveredRepeats.filter(shape => !selectedRepeats.some(repeat => repeat.id === shape.id)).map(shape => renderShape(shape, true))}
  </FretboardCanvas>
}
