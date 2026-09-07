import { useId } from 'react'
import type { BluesChord, BluesFretboardModel } from '../music/blues'
import { displayNote } from '../presentation/notes'

export type BluesLabelMode = 'notes' | 'degrees'

function markerStyle(position: BluesFretboardModel['positions'][number]) {
  if (position.chordTone?.role === 'third') return { className: 'is-third', label: '3rd target' }
  if (position.chordTone?.role === 'seventh') return { className: 'is-seventh', label: 'flat-seventh guide tone' }
  if (position.chordTone) return { className: 'is-chord-tone', label: `${position.chordTone.role} chord tone` }
  return { className: 'is-home-tone', label: 'home-scale tone' }
}

export function BluesFretboardView({
  model,
  chord,
  labelMode,
}: {
  readonly model: BluesFretboardModel
  readonly chord: BluesChord
  readonly labelMode: BluesLabelMode
}) {
  const titleId = useId()
  const descriptionId = useId()
  const step = 70
  const nut = 102
  const end = nut + model.fretEnd * step
  const fretX = (fret: number) => fret === 0 ? 73 : nut + (fret - 0.5) * step

  return <div className="fretboard-scroll blues-fretboard-scroll" tabIndex={0} role="region" aria-label="Target-note fretboard, scroll horizontally to explore all 22 frets">
    <svg
      className="blues-fretboard"
      style={{ minWidth: end + 24 }}
      viewBox={`0 0 ${end + 24} 258`}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>Home-scale and {displayNote(chord.name)} target notes on guitar</title>
      <desc id={descriptionId}>
        High E is at the top and low E at the bottom. Frets {model.fretStart} through {model.fretEnd}. Orange notes are thirds, purple notes are flat sevenths, and green notes belong to the home blues scale. {model.positions.map(position => `String ${position.string} fret ${position.fret}: ${displayNote(position.pitchClass.name)}, ${markerStyle(position).label}`).join('; ')}.
      </desc>

      <rect x={nut} y="30" width={end - nut} height="180" fill="#f3f1eb" />
      {[3, 5, 7, 9, 12, 15, 17, 19, 21].filter(fret => fret <= model.fretEnd).map(fret => <g key={fret} fill="#d3d1c7">
        {fret === 12
          ? <><circle cx={fretX(fret)} cy="84" r="4" /><circle cx={fretX(fret)} cy="156" r="4" /></>
          : <circle cx={fretX(fret)} cy="120" r="4" />}
      </g>)}
      {Array.from({ length: model.fretEnd + 1 }, (_, fret) => <g key={fret}>
        {fret > 0 && <line x1={nut + fret * step} x2={nut + fret * step} y1="30" y2="210" stroke="#bfc2b8" />}
        <text x={fretX(fret)} y="241" textAnchor="middle" className="fret-label">{fret}</text>
      </g>)}
      {[...model.tuning].reverse().map((note, index) => <g key={note.scientific}>
        <line x1="54" x2={end} y1={30 + index * 36} y2={30 + index * 36} stroke="#93988e" strokeWidth={0.8 + index * 0.18} />
        <text x="8" y={35 + index * 36} className="string-label">{displayNote(note.name)}<tspan dx="5" className="string-number">({index + 1})</tspan></text>
      </g>)}
      <line x1={nut} x2={nut} y1="29" y2="211" stroke="#464c42" strokeWidth="5" />

      {model.positions.map(position => {
        const style = markerStyle(position)
        const degree = position.chordTone?.label ?? position.scaleTone?.label ?? ''
        const label = labelMode === 'notes' ? displayNote(position.pitchClass.name) : displayNote(degree)
        return <g
          key={`${position.string}-${position.fret}`}
          className={`blues-fret-position ${style.className}`}
          transform={`translate(${fretX(position.fret)}, ${30 + (position.string - 1) * 36})`}
        >
          <circle r="15" className="blues-fret-marker" />
          <text textAnchor="middle" dominantBaseline="central" className="blues-fret-label">{label}</text>
        </g>
      })}
    </svg>
  </div>
}
