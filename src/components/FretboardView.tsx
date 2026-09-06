import { useId } from 'react'
import type { FretboardModel } from '../music/types'
import { displayNote, ROLE_STYLE } from '../presentation/notes'

export function RoleLegend() {
  return <ul className="role-legend" aria-label="Chord-tone roles">
    {Object.entries(ROLE_STYLE).map(([role, style]) => <li className={`role-${role}`} key={role}><span className="role-number">{style.number}</span><span>{style.label}</span></li>)}
  </ul>
}

/** Pure SVG adapter. Positions and spelling are supplied by the music engine. */
export function FretboardView({ model, chordName }: { model: FretboardModel; chordName: string }) {
  const titleId = useId()
  const descriptionId = useId()
  const step = 70
  const nut = 102
  const end = nut + model.fretCount * step
  const fretX = (fret: number) => fret === 0 ? 73 : nut + (fret - 0.5) * step
  return <div className="fretboard-scroll" tabIndex={0} role="region" aria-label="Guitar fretboard, scroll horizontally on small screens">
    <svg className="fretboard" viewBox={`0 0 ${end + 24} 260`} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
      <title id={titleId}>{displayNote(chordName)} chord tones on a guitar fretboard</title>
      <desc id={descriptionId}>High E is at the top, low E at the bottom. Frets zero through {model.fretCount}. Root markers are solid with role 1, thirds outlined with role 3, fifths dashed with role 5. These are available tones, not one playable chord shape. {model.positions.map(p => `String ${p.string} fret ${p.fret}: ${displayNote(p.tone.pitchClass.name)}, ${p.tone.role}`).join('; ')}.</desc>
      <rect x={nut} y="40" width={end - nut} height="175" fill="#f3f1eb" />
      {[3, 5, 7, 9, 12, 15].filter(fret => fret <= model.fretCount).map(fret => <g key={fret} fill="#d3d1c7">
        {fret === 12 ? <><circle cx={fretX(fret)} cy="92.5" r="4" /><circle cx={fretX(fret)} cy="162.5" r="4" /></> : <circle cx={fretX(fret)} cy="127.5" r="4" />}
      </g>)}
      {Array.from({ length: model.fretCount + 1 }, (_, fret) => <g key={fret}>
        {fret > 0 && <line x1={nut + fret * step} x2={nut + fret * step} y1="40" y2="215" stroke="#c6c7bd" />}
        <text x={fretX(fret)} y="247" textAnchor="middle" className="fret-label">{fret}</text>
      </g>)}
      {[...model.tuning].reverse().map((note, index) => <g key={note.scientific}>
        <line x1="55" x2={end} y1={40 + index * 35} y2={40 + index * 35} stroke="#a6a99f" strokeWidth={0.8 + index * 0.2} />
        <text x="9" y={45 + index * 35} className="string-label">{displayNote(note.name)}<tspan dx="5" className="string-number">({index + 1})</tspan></text>
      </g>)}
      <line x1={nut} x2={nut} y1="39" y2="216" stroke="#464c42" strokeWidth="5" />
      {model.positions.map(({ string, fret, tone }) => {
        const { color, number } = ROLE_STYLE[tone.role]
        return <g key={`${string}-${fret}`} transform={`translate(${fretX(fret)}, ${40 + (string - 1) * 35})`}>
          <circle r="14" fill={tone.role === 'root' ? color : '#faf9f6'} stroke={color} strokeWidth="1.6" strokeDasharray={tone.role === 'fifth' ? '3 2' : undefined} />
          <text textAnchor="middle" y="4.5" fill={tone.role === 'root' ? '#fff' : color} className="fret-note">{displayNote(tone.pitchClass.name)}</text>
          <rect x="9" y="7" width="12" height="12" rx="6" fill="#faf9f6" />
          <text x="15" y="16" textAnchor="middle" fill={color} className="fret-role">{number}</text>
        </g>
      })}
    </svg>
  </div>
}
