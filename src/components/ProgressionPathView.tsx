import { useId, type SVGProps } from 'react'
import type {
  ProgressionStep,
  ProgressionVoicingFretboardModel,
  VoicingFretPosition,
} from '../music/types'
import { chordIntervalLabel, displayNote } from '../presentation/notes'
import { FretboardCanvas, FretboardGrid } from './fretboard/FretboardCanvas'
import { createFretboardGeometry } from './fretboard/fretboardGeometry'

export type ProgressionLabelMode = 'key' | 'chord'

export const PROGRESSION_STEP_COLORS = [
  '#22685b',
  '#b45a3c',
  '#675aa3',
  '#a47718',
  '#34729a',
  '#a24768',
  '#5f7b38',
] as const

const FULL_CIRCLE = Math.PI * 2
const ARC_GAP = 0.15

function stepColor(stepIndex: number) {
  return PROGRESSION_STEP_COLORS[stepIndex % PROGRESSION_STEP_COLORS.length]
}

function pointOnCircle(radius: number, angle: number) {
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
}

function noteNameParts(noteName: string) {
  const match = /^([A-G])([#b]+)?$/.exec(noteName)
  return match
    ? { letter: match[1], accidental: match[2] ? displayNote(match[2]) : '' }
    : { letter: displayNote(noteName), accidental: '' }
}

function degreeLabelParts(label: string) {
  const match = /^([♭♯])(.+)$/.exec(label)
  return match ? { accidental: match[1], value: match[2] } : { accidental: '', value: label }
}

function stepArc(stepIndex: number, radius = 22) {
  const slot = FULL_CIRCLE / PROGRESSION_STEP_COLORS.length
  const start = -Math.PI / 2 + stepIndex * slot + ARC_GAP
  const end = -Math.PI / 2 + (stepIndex + 1) * slot - ARC_GAP
  const from = pointOnCircle(radius, start)
  const to = pointOnCircle(radius, end)
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 0 1 ${to.x} ${to.y}`
}

interface ProgressionPathViewProps {
  readonly model: ProgressionVoicingFretboardModel
  readonly steps: readonly ProgressionStep[]
  readonly selectedStep: ProgressionStep
  readonly progressionName: string
  readonly labelMode: ProgressionLabelMode
}

interface CoordinateEntry {
  readonly stepIndex: number
  readonly note: VoicingFretPosition
}

/**
 * Draws one connected, close-position inversion per progression step. Each
 * three-note line is a playable shape rather than a catalogue of possible tones.
 */
export function ProgressionPathView({
  model,
  steps,
  selectedStep,
  progressionName,
  labelMode,
}: ProgressionPathViewProps) {
  const titleId = useId()
  const descriptionId = useId()
  const allStrings = Array.from({ length: model.tuning.length }, (_, index) => index + 1)
  const selectedStringSet = new Set(model.strings)
  const geometry = createFretboardGeometry({
    fretCount: model.fretCount,
    stringCount: model.tuning.length,
    boardTop: 42,
    stringSpacing: 46,
    fretLabelOffset: 47,
    nutOverhang: 2,
    octaveDots: 'double',
    doubleDotInset: 52.5,
  })
  const selectedChordName = displayNote(selectedStep.triad.chordName)
  const selectedColor = stepColor(selectedStep.index)
  const orderedShapes = [...model.shapes].sort((left, right) => (
    Number(left.stepIndex === selectedStep.index) - Number(right.stepIndex === selectedStep.index)
  ))
  const coordinates = new Map<string, { string: number; fret: number; entries: CoordinateEntry[] }>()

  model.shapes.forEach(shape => shape.notes.forEach(note => {
    const key = `${note.string}-${note.fret}`
    const coordinate = coordinates.get(key) ?? { string: note.string, fret: note.fret, entries: [] }
    coordinate.entries.push({ stepIndex: shape.stepIndex, note })
    coordinates.set(key, coordinate)
  }))

  const details = <details className="sr-only">
    <summary>Detailed connected progression shapes</summary>
    <table>
      <caption>One selected inversion shape per progression step</caption>
      <thead><tr><th>Step</th><th>Chord</th><th>Inversion</th><th>String</th><th>Fret</th><th>Note</th><th>Scale degree</th><th>Chord interval</th><th>Chord role</th><th>Top note</th></tr></thead>
      <tbody>{model.shapes.flatMap(shape => {
        const step = steps[shape.stepIndex]
        return shape.notes.map(note => <tr key={`${shape.stepIndex}-${shape.fretOffset}-${note.string}`}>
          <td>{shape.stepIndex + 1}</td>
          <td>{displayNote(step.triad.chordName)}</td>
          <td>{step.voicing.inversion.name}</td>
          <td>{note.string}</td>
          <td>{note.fret}</td>
          <td>{displayNote(note.tone.pitch.name)}</td>
          <td>{note.degree}</td>
          <td>{chordIntervalLabel(note.tone.role, step.triad.quality)}</td>
          <td>{note.tone.role}</td>
          <td>{note.isTopNote ? 'Yes' : 'No'}</td>
        </tr>)
      })}</tbody>
    </table>
  </details>

  return <FretboardCanvas
    geometry={geometry}
    scrollLabel="Connected progression inversion shapes, scroll horizontally on small screens"
    scrollClassName="fretboard-scroll progression-path-scroll"
    svgProps={{
      className: 'fretboard progression-path-view',
      'aria-labelledby': `${titleId} ${descriptionId}`,
      'data-label-mode': labelMode,
    } as SVGProps<SVGSVGElement>}
    afterSvg={details}
  >
      <title id={titleId}>{displayNote(progressionName)}, seven connected chord-inversion shapes</title>
      <desc id={descriptionId}>
        All {allStrings.length} guitar strings are shown. Each progression step is a colored line connecting
        the three notes of its selected close-position inversion on strings {model.strings.join(', ')}.
        The numbered badge marks that chord's top note. Step {selectedStep.index + 1}, {selectedChordName},
        is selected, so its line is stronger and its three note circles are filled. {labelMode === 'key'
          ? 'Small badges show each note degree relative to the major key.'
          : 'Small badges appear only on the selected chord and show root, third, and fifth relative to that chord.'}
      </desc>
      <FretboardGrid
        geometry={geometry}
        tuning={model.tuning}
        stringOpacity={string => selectedStringSet.has(string) ? 1 : 0.48}
        stringStrokeWidth={0.75}
      />

      {orderedShapes.map(shape => {
        const color = stepColor(shape.stepIndex)
        const isSelected = shape.stepIndex === selectedStep.index
        const points = shape.notes.map(note => `${geometry.fretX(note.fret)},${geometry.stringY(note.string)}`).join(' ')
        return <g key={`${shape.stepIndex}-${shape.fretOffset}`}>
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth={isSelected ? 13 : 8}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isSelected ? 0.2 : 0.13}
          />
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth={isSelected ? 3.2 : 1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isSelected ? 1 : 0.72}
          />
        </g>
      })}

      {[...coordinates.values()].map(coordinate => {
        const selectedEntry = coordinate.entries.find(entry => entry.stepIndex === selectedStep.index)
        const labelEntry = selectedEntry ?? coordinate.entries[0]
        const noteName = noteNameParts(labelEntry.note.tone.pitch.name)
        const topNoteEntry = coordinate.entries.find(entry => entry.note.isTopNote)
        const x = geometry.fretX(coordinate.fret)
        const y = geometry.stringY(coordinate.string)
        const secondaryLabel = labelMode === 'key'
          ? `${labelEntry.note.degree}`
          : selectedEntry ? chordIntervalLabel(selectedEntry.note.tone.role, selectedStep.triad.quality) : null
        const degreeLabel = secondaryLabel ? degreeLabelParts(secondaryLabel) : null
        return <g key={`${coordinate.string}-${coordinate.fret}`} transform={`translate(${x}, ${y})`}>
          {coordinate.entries.map(entry => <path
            key={entry.stepIndex}
            d={stepArc(entry.stepIndex)}
            fill="none"
            stroke={stepColor(entry.stepIndex)}
            strokeWidth={entry.stepIndex === selectedStep.index ? 4 : 2.2}
            strokeLinecap="round"
          />)}
          <circle
            r="17"
            fill={selectedEntry ? selectedColor : '#faf9f6'}
            stroke={selectedEntry?.note.isTopNote ? '#252925' : selectedEntry ? selectedColor : '#8c9289'}
            strokeWidth={selectedEntry?.note.isTopNote ? 2.2 : 1}
          />
          <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fill={selectedEntry ? '#fff' : '#4e554e'} className="fret-note">
            {noteName.letter}
          </text>
          {noteName.accidental && <text x="4.25" y="-4" textAnchor="start" dominantBaseline="central" fill={selectedEntry ? '#fff' : '#4e554e'} className="fret-note-accidental">
            {noteName.accidental}
          </text>}
          {degreeLabel && <g className="progression-note-secondary" aria-hidden="true">
            <text x="0" y="12.5" textAnchor="middle" fill={selectedEntry ? '#fff' : '#343a34'} fontSize="8.5" fontWeight="600" opacity="0.88">
              {degreeLabel.value}
            </text>
            {degreeLabel.accidental && <text x="-3" y="12.5" textAnchor="end" fill={selectedEntry ? '#fff' : '#343a34'} fontSize="8.5" fontWeight="600" opacity="0.88">
              {degreeLabel.accidental}
            </text>}
          </g>}
          {topNoteEntry && <>
            <circle cx="-15" cy="-15" r="7" fill={stepColor(topNoteEntry.stepIndex)} stroke="#faf9f6" strokeWidth="1.2" />
            <text x="-15" y="-11.8" textAnchor="middle" fill="#fff" fontSize="8.5" fontWeight="700">
              {topNoteEntry.stepIndex + 1}
            </text>
          </>}
        </g>
      })}
  </FretboardCanvas>
}
