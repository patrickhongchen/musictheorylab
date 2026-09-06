import { useId } from 'react'
import type { ProgressionStep, ScaleFretboardModel } from '../music/types'
import { displayNote } from '../presentation/notes'

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

function pointOnCircle(radius: number, angle: number) {
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
}

function stepArc(stepIndex: number, radius = 17.5) {
  const slot = FULL_CIRCLE / PROGRESSION_STEP_COLORS.length
  const start = -Math.PI / 2 + stepIndex * slot + ARC_GAP
  const end = -Math.PI / 2 + (stepIndex + 1) * slot - ARC_GAP
  const from = pointOnCircle(radius, start)
  const to = pointOnCircle(radius, end)
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 0 1 ${to.x} ${to.y}`
}

function stepArcMidpoint(stepIndex: number, radius = 17.5) {
  const slot = FULL_CIRCLE / PROGRESSION_STEP_COLORS.length
  return pointOnCircle(radius, -Math.PI / 2 + (stepIndex + 0.5) * slot)
}

interface ProgressionPathViewProps {
  readonly model: ScaleFretboardModel
  readonly steps: readonly ProgressionStep[]
  readonly selectedStep: ProgressionStep
  readonly visibleStrings: ReadonlySet<number>
  readonly progressionName: string
}

/**
 * A scale-path view with all six strings retained for orientation. Scale-degree
 * markers appear only on the selected three-string working set.
 */
export function ProgressionPathView({
  model,
  steps,
  selectedStep,
  visibleStrings,
  progressionName,
}: ProgressionPathViewProps) {
  const titleId = useId()
  const descriptionId = useId()
  const fretStep = 70
  const nut = 102
  const end = nut + model.fretCount * fretStep
  const boardTop = 42
  const stringGap = 35
  const allStrings = Array.from({ length: model.tuning.length }, (_, index) => index + 1)
  const selectedStrings = [...visibleStrings]
    .filter(string => string >= 1 && string <= model.tuning.length)
    .sort((left, right) => left - right)
    .slice(0, 3)
  const selectedStringSet = new Set(selectedStrings)
  const boardBottom = boardTop + Math.max(0, allStrings.length - 1) * stringGap
  const fretLabelY = boardBottom + 47
  const viewHeight = fretLabelY + 13
  const fretX = (fret: number) => fret === 0 ? 73 : nut + (fret - 0.5) * fretStep
  const stringY = new Map(allStrings.map((string, index) => [string, boardTop + index * stringGap]))
  const positions = model.positions.filter(position => selectedStringSet.has(position.string))
  const selectedChordName = displayNote(selectedStep.triad.chordName)
  const selectedTopNote = displayNote(selectedStep.topNote.name)
  const selectedColor = PROGRESSION_STEP_COLORS[selectedStep.index]

  return <div
    className="fretboard-scroll progression-path-scroll"
    tabIndex={0}
    role="region"
    aria-label="Progression path with three selected strings, scroll horizontally on small screens"
  >
    <svg
      className="fretboard progression-path-view"
      viewBox={`0 0 ${end + 24} ${viewHeight}`}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>
        {displayNote(progressionName)}, step {selectedStep.index + 1}: {selectedChordName} marked on strings {selectedStrings.join(', ')}
      </title>
      <desc id={descriptionId}>
        All {allStrings.length} guitar strings are shown for orientation. Scale-degree markers one through seven
        appear only on selected strings {selectedStrings.join(', ') || 'none'}.
        Each note has a seven-part outline whose colored segments show which progression chords contain that note.
        A dot marks a chord's top note. The selected {selectedChordName} positions are filled and their outline
        segments are thicker. Its selected top note is {selectedTopNote}.
      </desc>

      {selectedStrings.length > 0 && <>
        <rect
          x={nut}
          y={boardTop}
          width={end - nut}
          height={Math.max(1, boardBottom - boardTop)}
          fill="#f3f1eb"
        />

        {Array.from({ length: model.fretCount + 1 }, (_, fret) => <g key={fret}>
          {fret > 0 && <line
            x1={nut + fret * fretStep}
            x2={nut + fret * fretStep}
            y1={boardTop}
            y2={boardBottom}
            stroke="#c6c7bd"
          />}
          <text x={fretX(fret)} y={fretLabelY} textAnchor="middle" className="fret-label">{fret}</text>
        </g>)}

        {allStrings.map(string => {
          const note = model.tuning[model.tuning.length - string]
          const y = stringY.get(string) ?? boardTop
          const isSelected = selectedStringSet.has(string)
          return <g key={string} opacity={isSelected ? 1 : 0.48}>
            <line
              x1="55"
              x2={end}
              y1={y}
              y2={y}
              stroke="#a6a99f"
              strokeWidth={0.75 + (string - 1) * 0.2}
            />
            <text x="9" y={y + 5} className="string-label">
              {displayNote(note.name)}<tspan dx="5" className="string-number">({string})</tspan>
            </text>
          </g>
        })}
        <line x1={nut} x2={nut} y1={boardTop - 2} y2={boardBottom + 2} stroke="#464c42" strokeWidth="5" />

        {positions.map(position => {
          const y = stringY.get(position.string)
          if (y === undefined) return null
          const memberships = steps.filter(step => step.triad.tones.some(
            tone => tone.pitchClass.chroma === position.pitchClass.chroma,
          ))
          const isSelectedChordTone = memberships.some(step => step.index === selectedStep.index)
          const isSelectedTopNote = position.pitchClass.chroma === selectedStep.topNote.chroma
          const x = fretX(position.fret)

          return <g key={`${position.string}-${position.fret}`} transform={`translate(${x}, ${y})`}>
            {memberships.map(step => {
              const color = PROGRESSION_STEP_COLORS[step.index]
              const isSelected = step.index === selectedStep.index
              const isTopNote = position.pitchClass.chroma === step.topNote.chroma
              const dot = stepArcMidpoint(step.index)
              return <g key={step.index}>
                <path
                  d={stepArc(step.index)}
                  fill="none"
                  stroke={color}
                  strokeWidth={isSelected ? 4.2 : 2.2}
                  strokeLinecap="round"
                  opacity={isSelected ? 1 : 0.76}
                />
                {isTopNote && <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={isSelected ? 3.2 : 2.5}
                  fill={color}
                  stroke="#faf9f6"
                  strokeWidth="1"
                />}
              </g>
            })}
            <circle
              r="12"
              fill={isSelectedChordTone ? selectedColor : '#faf9f6'}
              stroke={isSelectedTopNote ? '#252925' : isSelectedChordTone ? selectedColor : '#8c9289'}
              strokeWidth={isSelectedTopNote ? 2.2 : 1}
            />
            <text
              textAnchor="middle"
              y="4.2"
              fill={isSelectedChordTone ? '#fff' : '#4e554e'}
              className="fret-note"
            >
              {displayNote(position.pitchClass.name)}
            </text>
            <circle cx="10" cy="9" r="6" fill="#faf9f6" stroke={isSelectedTopNote ? '#252925' : '#8c9289'} strokeWidth="0.8" />
            <text x="10" y="12.2" textAnchor="middle" fill="#343a34" fontSize="9" fontWeight="700">
              {position.degree}
            </text>
          </g>
        })}
      </>}

      {selectedStrings.length === 0 && <text
        x={(end + 24) / 2}
        y={viewHeight / 2}
        textAnchor="middle"
        fill="#656961"
        fontSize="14"
      >Choose up to three strings to see the progression path.</text>}
    </svg>
    <details className="sr-only">
      <summary>Detailed progression-path fret coordinates</summary>
      <table>
        <caption>Visible scale degrees and progression-chord memberships</caption>
        <thead><tr><th>String</th><th>Fret</th><th>Note</th><th>Scale degree</th><th>Progression chords</th><th>Selected top-note anchor</th></tr></thead>
        <tbody>{positions.map(position => {
          const memberships = steps.filter(step => step.triad.tones.some(
            tone => tone.pitchClass.chroma === position.pitchClass.chroma,
          ))
          const isTopNote = position.pitchClass.chroma === selectedStep.topNote.chroma
          return <tr key={`${position.string}-${position.fret}`}>
            <td>{position.string}</td>
            <td>{position.fret}</td>
            <td>{displayNote(position.pitchClass.name)}</td>
            <td>{position.degree}</td>
            <td>{memberships.map(step => `Step ${step.index + 1} ${step.triad.romanNumeral}${position.pitchClass.chroma === step.topNote.chroma ? ', top note' : ''}`).join('; ')}</td>
            <td>{isTopNote ? 'Yes' : 'No'}</td>
          </tr>
        })}</tbody>
      </table>
    </details>
  </div>
}
