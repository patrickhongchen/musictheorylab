import { useId } from 'react'
import { CAGED_FORMS, type CagedScalePosition } from '../music/cagedScalePositions'
import type { CagedForm } from '../music/chordShapes'
import type { ScaleToneFretboardModel } from '../music/types'
import { displayNote } from '../presentation/notes'
import { scaleToneRole, SCALE_TONE_STYLE } from '../presentation/scales'

export type ScaleFretboardLabelMode = 'notes' | 'degrees'

export interface ScaleFretboardViewProps {
  readonly model: ScaleToneFretboardModel
  readonly scaleName: string
  readonly labelMode: ScaleFretboardLabelMode
  readonly cagedPositions: readonly CagedScalePosition[]
  readonly activeCagedForm: 'all' | CagedForm
}

/** Pure SVG adapter. Scale positions and note spelling are supplied by the music engine. */
export function ScaleFretboardView({
  model,
  scaleName,
  labelMode,
  cagedPositions,
  activeCagedForm,
}: ScaleFretboardViewProps) {
  const titleId = useId()
  const descriptionId = useId()
  const step = 70
  const nut = 102
  const end = nut + model.fretCount * step
  const boardTop = 76
  const fretX = (fret: number) => fret === 0 ? 73 : nut + (fret - 0.5) * step
  const regionStartX = (fret: number) => fret === 0 ? 55 : nut + (fret - 1) * step
  const regionEndX = (fret: number) => fret === 0 ? nut : nut + fret * step
  const cagedLane = new Map<CagedForm, number>(CAGED_FORMS.map((form, index) => [form, index]))
  const positionIsActive = (fret: number) => activeCagedForm === 'all' || cagedPositions.some(position => (
    position.form === activeCagedForm && fret >= position.startFret && fret <= position.endFret
  ))

  return <div className="fretboard-scroll scale-fretboard-scroll" tabIndex={0} role="region" aria-label="Guitar scale fretboard, scroll horizontally on small screens">
    <svg
      className="fretboard scale-fretboard"
      style={{ minWidth: end + 24 }}
      viewBox={`0 0 ${end + 24} 296`}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>{displayNote(scaleName)} scale tones on a guitar fretboard</title>
      <desc id={descriptionId}>
        High E is at the top, low E at the bottom. Frets zero through {model.fretCount}. Root notes are solid green; thirds are orange; fifths are purple; the other scale tones are outlined. CAGED position bands are based on movable tonic chord shapes. {activeCagedForm === 'all' ? 'All five overlapping CAGED positions are shown.' : `${activeCagedForm} shape tones are emphasized and notes outside its regions are dimmed.`} Labels show {labelMode === 'notes' ? 'note names' : 'scale degrees'}. {model.positions.map(({ string, fret, tone }) => `String ${string} fret ${fret}: ${displayNote(tone.pitchClass.name)}, degree ${displayNote(tone.label)}`).join('; ')}.
      </desc>

      <text x="9" y="24" className="caged-ruler-title">CAGED</text>
      {cagedPositions.map(position => {
        const x = regionStartX(position.startFret)
        const width = regionEndX(position.endFret) - x
        const isActive = activeCagedForm === 'all' || activeCagedForm === position.form
        const y = 10 + cagedLane.get(position.form)! * 10
        return <g key={position.id} opacity={isActive ? 1 : 0.28}>
          <rect
            className={`caged-region${activeCagedForm === position.form ? ' is-active' : ''}`}
            x={x}
            y={y}
            width={width}
            height="7"
            rx="3.5"
          />
          <text
            className={`caged-region-label${activeCagedForm === position.form ? ' is-active' : ''}`}
            x={x + width / 2}
            y={y + 6}
            textAnchor="middle"
          >{position.form}</text>
        </g>
      })}

      <rect x={nut} y={boardTop} width={end - nut} height="175" fill="#f3f1eb" />
      {[3, 5, 7, 9, 12, 15, 17, 19, 21].filter(fret => fret <= model.fretCount).map(fret => <g key={fret} fill="#d3d1c7">
        {fret === 12
          ? <><circle cx={fretX(fret)} cy={boardTop + 52.5} r="4" /><circle cx={fretX(fret)} cy={boardTop + 122.5} r="4" /></>
          : <circle cx={fretX(fret)} cy={boardTop + 87.5} r="4" />}
      </g>)}
      {Array.from({ length: model.fretCount + 1 }, (_, fret) => <g key={fret}>
        {fret > 0 && <line x1={nut + fret * step} x2={nut + fret * step} y1={boardTop} y2={boardTop + 175} stroke="#c6c7bd" />}
        <text x={fretX(fret)} y="283" textAnchor="middle" className="fret-label">{fret}</text>
      </g>)}
      {[...model.tuning].reverse().map((note, index) => <g key={note.scientific}>
        <line x1="55" x2={end} y1={boardTop + index * 35} y2={boardTop + index * 35} stroke="#a6a99f" strokeWidth={0.8 + index * 0.2} />
        <text x="9" y={boardTop + 5 + index * 35} className="string-label">
          {displayNote(note.name)}<tspan dx="5" className="string-number">({index + 1})</tspan>
        </text>
      </g>)}
      <line x1={nut} x2={nut} y1={boardTop - 1} y2={boardTop + 176} stroke="#464c42" strokeWidth="5" />

      {model.positions.map(({ string, fret, tone }) => {
        const role = scaleToneRole(tone.label)
        const { color } = SCALE_TONE_STYLE[role]
        const isRoot = role === 'root'
        const label = labelMode === 'notes' ? displayNote(tone.pitchClass.name) : displayNote(tone.label)

        return <g
          className={`scale-fret-position scale-role-${role}`}
          key={`${string}-${fret}`}
          transform={`translate(${fretX(fret)}, ${boardTop + (string - 1) * 35})`}
          opacity={positionIsActive(fret) ? 1 : 0.16}
        >
          <circle
            className="scale-tone-marker"
            r={isRoot ? 15 : 14}
            fill={isRoot ? color : '#faf9f6'}
            stroke={color}
            strokeWidth={isRoot ? 2.2 : 1.8}
            strokeDasharray={role === 'color' ? '1 4' : undefined}
            strokeLinecap={role === 'color' ? 'round' : undefined}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill={isRoot ? '#fff' : color}
            className={`fret-note scale-tone-label scale-tone-label-${labelMode}`}
          >
            {label}
          </text>
        </g>
      })}
    </svg>
  </div>
}
