import { CagedRegionOverlay } from './fretboard/CagedRegionOverlay'
import { FretboardCanvas, FretboardGrid } from './fretboard/FretboardCanvas'
import { createFretboardGeometry } from './fretboard/fretboardGeometry'
import { useId } from 'react'
import type { CagedPosition, CagedForm } from '../music/caged'
import type { ScaleToneFretboardModel } from '../music/types'
import { displayNote } from '../presentation/notes'
import { scaleToneRole, SCALE_TONE_STYLE } from '../presentation/scales'

export type ScaleFretboardLabelMode = 'notes' | 'degrees'

export interface ScaleFretboardViewProps {
  readonly model: ScaleToneFretboardModel
  readonly scaleName: string
  readonly labelMode: ScaleFretboardLabelMode
  readonly cagedPositions: readonly CagedPosition[]
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
  const geometry = createFretboardGeometry({ fretCount: model.fretCount, stringCount: model.tuning.length, boardTop: 76 })
  const { fretX, stringY } = geometry
  const positionIsActive = (fret: number) => activeCagedForm === 'all' || cagedPositions.some(position => (
    position.form === activeCagedForm && fret >= position.startFret && fret <= position.endFret
  ))

  return <FretboardCanvas
    geometry={geometry}
    scrollLabel="Guitar scale fretboard, scroll horizontally on small screens"
    svgProps={{ className: 'fretboard scale-fretboard', 'aria-labelledby': `${titleId} ${descriptionId}` }}
  >
      <title id={titleId}>{displayNote(scaleName)} scale tones on a guitar fretboard</title>
      <desc id={descriptionId}>
        High E is at the top, low E at the bottom. Frets zero through {model.fretCount}. Root notes are solid green; thirds are orange; fifths are purple; the other scale tones are outlined. CAGED position bands are based on movable tonic chord shapes. {activeCagedForm === 'all' ? 'All five overlapping CAGED positions are shown.' : `${activeCagedForm} shape tones are emphasized and notes outside its regions are dimmed.`} Labels show {labelMode === 'notes' ? 'note names' : 'scale degrees'}. {model.positions.map(({ string, fret, tone }) => `String ${string} fret ${fret}: ${displayNote(tone.pitchClass.name)}, degree ${displayNote(tone.label)}`).join('; ')}.
      </desc>

      <CagedRegionOverlay geometry={geometry} positions={cagedPositions} activeForm={activeCagedForm} />
      <FretboardGrid geometry={geometry} tuning={model.tuning} />

      {model.positions.map(({ string, fret, tone }) => {
        const role = scaleToneRole(tone.label)
        const { color } = SCALE_TONE_STYLE[role]
        const isRoot = role === 'root'
        const label = labelMode === 'notes' ? displayNote(tone.pitchClass.name) : displayNote(tone.label)

        return <g
          className={`scale-fret-position scale-role-${role}`}
          key={`${string}-${fret}`}
          transform={`translate(${fretX(fret)}, ${stringY(string)})`}
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
  </FretboardCanvas>
}
