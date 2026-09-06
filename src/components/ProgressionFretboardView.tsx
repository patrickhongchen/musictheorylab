import { useId } from 'react'
import type { ChordToneRole, ProgressionFretboardModel } from '../music/types'
import { displayNote, ROLE_STYLE } from '../presentation/notes'

interface ProgressionFretboardViewProps {
  readonly model: ProgressionFretboardModel
  readonly visibleStrings: ReadonlySet<number>
  readonly spotlightStep: number | null
  readonly progressionName: string
}

const STEP_COUNT = 7

/**
 * One-board overview of a complete progression. A physical position is rendered
 * once, while its seven small slots retain the chord-tone role at each step.
 */
export function ProgressionFretboardView({
  model,
  visibleStrings,
  spotlightStep,
  progressionName,
}: ProgressionFretboardViewProps) {
  const titleId = useId()
  const descriptionId = useId()
  const step = 70
  const nut = 102
  const end = nut + model.fretCount * step
  const fretX = (fret: number) => fret === 0 ? 73 : nut + (fret - 0.5) * step
  const visiblePositions = model.positions.filter(position => visibleStrings.has(position.string))
  const hiddenStrings = Array.from({ length: 6 }, (_, index) => index + 1)
    .filter(string => !visibleStrings.has(string))

  return <div
    className="fretboard-scroll"
    tabIndex={0}
    role="region"
    aria-label="Progression map guitar fretboard, scroll horizontally on small screens"
  >
    <svg
      className="fretboard progression-fretboard"
      viewBox={`0 0 ${end + 24} 260`}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>{displayNote(progressionName)} across a guitar fretboard</title>
      <desc id={descriptionId}>
        High E is at the top and low E at the bottom. Frets zero through {model.fretCount}.
        Each note has seven slots, one for each progression step. Root slots are solid green,
        thirds are outlined rust, and fifths are dashed violet.
        {spotlightStep === null ? ' No step is spotlighted.' : ` Step ${spotlightStep + 1} is spotlighted; the other steps remain visible.`}
        {hiddenStrings.length === 0 ? ' All strings are shown.' : ` Hidden strings: ${hiddenStrings.join(', ')}.`}
        {visiblePositions.length === 0 ? ' No note positions are shown.' : ' Detailed fret coordinates are available after the image.'}
      </desc>

      <rect x={nut} y="40" width={end - nut} height="175" fill="#f3f1eb" />
      {[3, 5, 7, 9, 12, 15].filter(fret => fret <= model.fretCount).map(fret => <g key={fret} fill="#d3d1c7">
        {fret === 12
          ? <><circle cx={fretX(fret)} cy="92.5" r="4" /><circle cx={fretX(fret)} cy="162.5" r="4" /></>
          : <circle cx={fretX(fret)} cy="127.5" r="4" />}
      </g>)}

      {Array.from({ length: model.fretCount + 1 }, (_, fret) => <g key={fret}>
        {fret > 0 && <line x1={nut + fret * step} x2={nut + fret * step} y1="40" y2="215" stroke="#c6c7bd" />}
        <text x={fretX(fret)} y="247" textAnchor="middle" className="fret-label">{fret}</text>
      </g>)}

      {[...model.tuning].reverse().map((note, index) => {
        const string = index + 1
        const isVisible = visibleStrings.has(string)
        return <g key={note.scientific} opacity={isVisible ? 1 : 0.22}>
          <line
            x1="55"
            x2={end}
            y1={40 + index * 35}
            y2={40 + index * 35}
            stroke="#a6a99f"
            strokeWidth={0.8 + index * 0.2}
          />
          <text x="9" y={45 + index * 35} className="string-label">
            {displayNote(note.name)}<tspan dx="5" className="string-number">({string})</tspan>
          </text>
        </g>
      })}
      <line x1={nut} x2={nut} y1="39" y2="216" stroke="#464c42" strokeWidth="5" />

      {visiblePositions.map(position => {
        const firstMarker = position.markers[0]
        if (!firstMarker) return null
        const markerByStep = new Map(position.markers.map(marker => [marker.stepIndex, marker]))
        const y = 40 + (position.string - 1) * 35

        return <g key={`${position.string}-${position.fret}`} transform={`translate(${fretX(position.fret)}, ${y})`}>
          <circle r="12" fill="#faf9f6" stroke="#737a71" strokeWidth="1.4" />
          <text textAnchor="middle" y="4" fill="#343a34" className="fret-note">
            {displayNote(firstMarker.tone.pitchClass.name)}
          </text>

          <g transform="translate(0, 15)">
            <rect x="-20" y="-4.5" width="40" height="9" rx="4.5" fill="#faf9f6" stroke="#d9dbd3" strokeWidth="0.7" />
            {Array.from({ length: STEP_COUNT }, (_, stepIndex) => {
              const marker = markerByStep.get(stepIndex)
              const isSpotlighted = spotlightStep === stepIndex
              const isDeemphasized = spotlightStep !== null && !isSpotlighted
              const x = -15 + stepIndex * 5

              if (!marker) {
                return <circle
                  key={stepIndex}
                  cx={x}
                  r={isSpotlighted ? 2.6 : 1.65}
                  fill="#e1e3dc"
                  stroke={isSpotlighted ? '#737a71' : 'none'}
                  strokeWidth="0.7"
                  opacity={isDeemphasized ? 0.48 : 1}
                />
              }

              const role = marker.tone.role as ChordToneRole
              const { color } = ROLE_STYLE[role]
              return <circle
                key={stepIndex}
                cx={x}
                r={isSpotlighted ? 3.1 : 2.15}
                fill={role === 'root' ? color : '#faf9f6'}
                stroke={color}
                strokeWidth={isSpotlighted ? 1.35 : 1}
                strokeDasharray={role === 'fifth' ? '1.2 0.9' : undefined}
                opacity={isDeemphasized ? 0.5 : 1}
              />
            })}
          </g>
        </g>
      })}
    </svg>
    <details className="sr-only">
      <summary>Detailed progression-map fret coordinates</summary>
      <table>
        <caption>Visible fret positions and their progression-step roles</caption>
        <thead><tr><th>String</th><th>Fret</th><th>Note</th><th>Progression roles</th></tr></thead>
        <tbody>{visiblePositions.map(position => <tr key={`${position.string}-${position.fret}`}>
          <td>{position.string}</td>
          <td>{position.fret}</td>
          <td>{displayNote(position.markers[0]?.tone.pitchClass.name ?? '')}</td>
          <td>{position.markers.map(marker => `Step ${marker.stepIndex + 1} ${marker.triad.romanNumeral}, ${marker.tone.role}`).join('; ')}</td>
        </tr>)}</tbody>
      </table>
    </details>
  </div>
}
