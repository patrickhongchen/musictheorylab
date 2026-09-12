import { CAGED_FORMS, type CagedForm, type CagedPosition } from '../../music/caged'
import type { FretboardGeometry } from './fretboardGeometry'

interface CagedRegionOverlayProps {
  readonly geometry: FretboardGeometry
  readonly positions: readonly CagedPosition[]
  readonly activeForm: 'all' | CagedForm
}

/** Visual lanes only. Regions and repeated positions come from music/caged. */
export function CagedRegionOverlay({ geometry, positions, activeForm }: CagedRegionOverlayProps) {
  return <g className="caged-ruler">
    <text x="9" y="24" className="caged-ruler-title">CAGED</text>
    {positions.map(position => {
      const start = Math.max(geometry.fretStart, position.startFret)
      const end = Math.min(geometry.fretCount, position.endFret)
      if (start > end) return null
      const x = geometry.fretStartX(start)
      const width = geometry.fretEndX(end) - x
      const isActive = activeForm === 'all' || activeForm === position.form
      const y = 10 + CAGED_FORMS.indexOf(position.form) * 10
      return <g key={position.id} opacity={isActive ? 1 : 0.28}>
        <rect
          className={`caged-region${activeForm === position.form ? ' is-active' : ''}`}
          x={x} y={y} width={width} height="7" rx="3.5"
        />
        <text
          className={`caged-region-label${activeForm === position.form ? ' is-active' : ''}`}
          x={x + width / 2} y={y + 6} textAnchor="middle"
        >{position.form}</text>
      </g>
    })}
  </g>
}
