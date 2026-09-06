import { useId } from 'react'
import type { ProgressionStep, ScaleFretboardModel } from '../music/types'
import { displayNote, ROLE_STYLE } from '../presentation/notes'

interface ProgressionPathViewProps {
  readonly model: ScaleFretboardModel
  readonly selectedStep: ProgressionStep
  readonly visibleStrings: ReadonlySet<number>
  readonly progressionName: string
}

/**
 * A compact scale-path view for a three-string working set. Scale degrees remain
 * visible as landmarks while the selected step's chord tones carry role styling.
 */
export function ProgressionPathView({
  model,
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
  const stringGap = 48
  const selectedStrings = [...visibleStrings]
    .filter(string => string >= 1 && string <= model.tuning.length)
    .sort((left, right) => left - right)
    .slice(0, 3)
  const boardBottom = boardTop + Math.max(0, selectedStrings.length - 1) * stringGap
  const fretLabelY = boardBottom + 47
  const viewHeight = fretLabelY + 13
  const fretX = (fret: number) => fret === 0 ? 73 : nut + (fret - 0.5) * fretStep
  const stringY = new Map(selectedStrings.map((string, index) => [string, boardTop + index * stringGap]))
  const positions = model.positions.filter(position => stringY.has(position.string))
  const selectedChordName = displayNote(selectedStep.triad.chordName)
  const selectedTopNote = displayNote(selectedStep.topNote.name)

  return <div
    className="fretboard-scroll progression-path-scroll"
    tabIndex={0}
    role="region"
    aria-label="Three-string progression path, scroll horizontally on small screens"
  >
    <svg
      className="fretboard progression-path-view"
      viewBox={`0 0 ${end + 24} ${viewHeight}`}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>
        {displayNote(progressionName)}, step {selectedStep.index + 1}: {selectedChordName} on three guitar strings
      </title>
      <desc id={descriptionId}>
        Scale-degree landmarks one through seven remain visible on strings {selectedStrings.join(', ') || 'none'}.
        Every position in {selectedChordName} is highlighted by chord-tone role: roots are solid green,
        thirds are outlined rust, and fifths are dashed violet. Degree {selectedStep.topDegree},
        the selected top note {selectedTopNote}, has an additional dark ring.
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

        {selectedStrings.map(string => {
          const note = model.tuning[model.tuning.length - string]
          const y = stringY.get(string) ?? boardTop
          return <g key={string}>
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
          const tone = selectedStep.triad.tones.find(candidate => candidate.pitchClass.chroma === position.pitchClass.chroma)
          const isTopNote = position.degree === selectedStep.topDegree
          const x = fretX(position.fret)

          if (!tone) {
            return <g key={`${position.string}-${position.fret}`} transform={`translate(${x}, ${y})`}>
              <circle r="8.5" fill="#faf9f6" stroke="#8c9289" strokeWidth="1" />
              <text textAnchor="middle" y="3.8" fill="#4e554e" fontSize="10.5" fontWeight="600">{position.degree}</text>
            </g>
          }

          const { color } = ROLE_STYLE[tone.role]
          return <g key={`${position.string}-${position.fret}`} transform={`translate(${x}, ${y})`}>
            {isTopNote && <circle r="18" fill="#faf9f6" stroke="#252925" strokeWidth="2" />}
            <circle
              r={isTopNote ? 14.5 : 13}
              fill={tone.role === 'root' ? color : '#faf9f6'}
              stroke={color}
              strokeWidth={isTopNote ? 2 : 1.6}
              strokeDasharray={tone.role === 'fifth' ? '3 2' : undefined}
            />
            <text
              textAnchor="middle"
              y="4.2"
              fill={tone.role === 'root' ? '#fff' : color}
              className="fret-note"
            >
              {displayNote(position.pitchClass.name)}
            </text>
            <circle cx="11" cy="10" r="7" fill="#faf9f6" stroke={isTopNote ? '#252925' : color} strokeWidth="0.8" />
            <text x="11" y="13.2" textAnchor="middle" fill="#343a34" fontSize="9" fontWeight="700">
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
        <caption>Visible scale degrees and selected-chord roles</caption>
        <thead><tr><th>String</th><th>Fret</th><th>Note</th><th>Scale degree</th><th>Selected chord role</th><th>Top-note anchor</th></tr></thead>
        <tbody>{positions.map(position => {
          const tone = selectedStep.triad.tones.find(candidate => candidate.pitchClass.chroma === position.pitchClass.chroma)
          const isTopNote = position.degree === selectedStep.topDegree
          return <tr key={`${position.string}-${position.fret}`}>
            <td>{position.string}</td>
            <td>{position.fret}</td>
            <td>{displayNote(position.pitchClass.name)}</td>
            <td>{position.degree}</td>
            <td>{tone?.role ?? 'Not in selected chord'}</td>
            <td>{isTopNote ? 'Yes' : 'No'}</td>
          </tr>
        })}</tbody>
      </table>
    </details>
  </div>
}
