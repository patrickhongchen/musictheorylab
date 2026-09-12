import { FretboardCanvas, FretboardGrid } from './fretboard/FretboardCanvas'
import { createFretboardGeometry } from './fretboard/fretboardGeometry'
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
  const geometry = createFretboardGeometry({ fretCount: model.fretCount, stringCount: model.tuning.length })
  const { fretX, stringY } = geometry
  return <FretboardCanvas
    geometry={geometry}
    scrollLabel="Guitar fretboard, scroll horizontally on small screens"
    svgProps={{ 'aria-labelledby': `${titleId} ${descriptionId}` }}
  >
      <title id={titleId}>{displayNote(chordName)} chord tones on a guitar fretboard</title>
      <desc id={descriptionId}>High E is at the top, low E at the bottom. Frets zero through {model.fretCount}. Root markers are solid with role 1, thirds outlined with role 3, fifths dashed with role 5. These are available tones, not one playable chord shape. {model.positions.map(p => `String ${p.string} fret ${p.fret}: ${displayNote(p.tone.pitchClass.name)}, ${p.tone.role}`).join('; ')}.</desc>
      <FretboardGrid geometry={geometry} tuning={model.tuning} />

      {model.positions.map(({ string, fret, tone }) => {
        const { color, number } = ROLE_STYLE[tone.role]
        return <g key={`${string}-${fret}`} transform={`translate(${fretX(fret)}, ${stringY(string)})`}>
          <circle r="14" fill={tone.role === 'root' ? color : '#faf9f6'} stroke={color} strokeWidth="1.6" strokeDasharray={tone.role === 'fifth' ? '3 2' : undefined} />
          <text textAnchor="middle" y="4.5" fill={tone.role === 'root' ? '#fff' : color} className="fret-note">{displayNote(tone.pitchClass.name)}</text>
          <rect x="9" y="7" width="12" height="12" rx="6" fill="#faf9f6" />
          <text x="15" y="16" textAnchor="middle" fill={color} className="fret-role">{number}</text>
        </g>
      })}
  </FretboardCanvas>
}
