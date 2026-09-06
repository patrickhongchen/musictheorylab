import { useId } from 'react'
import type { PentatonicScaleFretboardModel } from '../music/types'
import { displayNote } from '../presentation/notes'

export type ScaleFretboardLabelMode = 'notes' | 'degrees'

export interface ScaleFretboardViewProps {
  readonly model: PentatonicScaleFretboardModel
  readonly scaleName: string
  readonly labelMode: ScaleFretboardLabelMode
}

type ScaleToneRole = 'root' | 'third' | 'fifth' | 'color'

const SCALE_TONE_STYLE: Record<ScaleToneRole, { label: string; color: string }> = {
  root: { label: 'Root', color: '#22685b' },
  third: { label: 'Third', color: '#a24b22' },
  fifth: { label: 'Fifth', color: '#72558e' },
  color: { label: 'Scale tone', color: '#656961' },
}

function scaleToneRole(label: string): ScaleToneRole {
  const normalized = label.replace('b', '♭').replace('#', '♯')
  if (normalized === '1') return 'root'
  if (normalized === '3' || normalized === '♭3') return 'third'
  if (normalized === '5') return 'fifth'
  return 'color'
}

export function ScaleToneLegend() {
  return <ul className="role-legend scale-tone-legend" aria-label="Scale-tone colors">
    {(Object.entries(SCALE_TONE_STYLE) as [ScaleToneRole, (typeof SCALE_TONE_STYLE)[ScaleToneRole]][]).map(([role, style]) => (
      <li className={`scale-role-${role}${role === 'root' ? ' role-root' : ''}`} key={role}>
        <span className="role-number" style={{ color: role === 'root' ? undefined : style.color }}>{role === 'root' ? '1' : role === 'third' ? '3' : role === 'fifth' ? '5' : '•'}</span>
        <span>{style.label}</span>
      </li>
    ))}
  </ul>
}

/** Pure SVG adapter. Scale positions and note spelling are supplied by the music engine. */
export function ScaleFretboardView({ model, scaleName, labelMode }: ScaleFretboardViewProps) {
  const titleId = useId()
  const descriptionId = useId()
  const step = 70
  const nut = 102
  const end = nut + model.fretCount * step
  const fretX = (fret: number) => fret === 0 ? 73 : nut + (fret - 0.5) * step

  return <div className="fretboard-scroll scale-fretboard-scroll" tabIndex={0} role="region" aria-label="Guitar scale fretboard, scroll horizontally on small screens">
    <svg
      className="fretboard scale-fretboard"
      style={{ minWidth: end + 24 }}
      viewBox={`0 0 ${end + 24} 260`}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>{displayNote(scaleName)} scale tones on a guitar fretboard</title>
      <desc id={descriptionId}>
        High E is at the top, low E at the bottom. Frets zero through {model.fretCount}. Root notes are solid green; thirds are orange; fifths are purple; the other pentatonic tones are outlined. Labels show {labelMode === 'notes' ? 'note names' : 'scale degrees'}. {model.positions.map(({ string, fret, tone }) => `String ${string} fret ${fret}: ${displayNote(tone.pitchClass.name)}, degree ${displayNote(tone.label)}`).join('; ')}.
      </desc>

      <rect x={nut} y="40" width={end - nut} height="175" fill="#f3f1eb" />
      {[3, 5, 7, 9, 12, 15, 17, 19, 21].filter(fret => fret <= model.fretCount).map(fret => <g key={fret} fill="#d3d1c7">
        {fret === 12
          ? <><circle cx={fretX(fret)} cy="92.5" r="4" /><circle cx={fretX(fret)} cy="162.5" r="4" /></>
          : <circle cx={fretX(fret)} cy="127.5" r="4" />}
      </g>)}
      {Array.from({ length: model.fretCount + 1 }, (_, fret) => <g key={fret}>
        {fret > 0 && <line x1={nut + fret * step} x2={nut + fret * step} y1="40" y2="215" stroke="#c6c7bd" />}
        <text x={fretX(fret)} y="247" textAnchor="middle" className="fret-label">{fret}</text>
      </g>)}
      {[...model.tuning].reverse().map((note, index) => <g key={note.scientific}>
        <line x1="55" x2={end} y1={40 + index * 35} y2={40 + index * 35} stroke="#a6a99f" strokeWidth={0.8 + index * 0.2} />
        <text x="9" y={45 + index * 35} className="string-label">
          {displayNote(note.name)}<tspan dx="5" className="string-number">({index + 1})</tspan>
        </text>
      </g>)}
      <line x1={nut} x2={nut} y1="39" y2="216" stroke="#464c42" strokeWidth="5" />

      {model.positions.map(({ string, fret, tone }) => {
        const role = scaleToneRole(tone.label)
        const { color } = SCALE_TONE_STYLE[role]
        const isRoot = role === 'root'
        const label = labelMode === 'notes' ? displayNote(tone.pitchClass.name) : displayNote(tone.label)

        return <g
          className={`scale-fret-position scale-role-${role}`}
          key={`${string}-${fret}`}
          transform={`translate(${fretX(fret)}, ${40 + (string - 1) * 35})`}
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
