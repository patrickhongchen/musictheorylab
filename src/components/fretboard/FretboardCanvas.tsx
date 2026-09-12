import type { ReactNode, SVGProps } from 'react'
import type { Pitch } from '../../music/types'
import { displayNote } from '../../presentation/notes'
import type { FretboardGeometry } from './fretboardGeometry'

interface FretboardCanvasProps {
  readonly geometry: FretboardGeometry
  readonly scrollLabel: string
  readonly scrollClassName?: string
  readonly svgProps?: SVGProps<SVGSVGElement>
  readonly children: ReactNode
  readonly afterSvg?: ReactNode
}

/** The caller supplies SVG semantics and composes physical and musical layers in paint order. */
export function FretboardCanvas({ geometry, scrollLabel, scrollClassName = 'fretboard-scroll', svgProps, children, afterSvg }: FretboardCanvasProps) {
  return <div className={scrollClassName} tabIndex={0} role="region" aria-label={scrollLabel}>
    <svg className="fretboard" {...svgProps} style={{ minWidth: geometry.width, ...svgProps?.style }} viewBox={`0 0 ${geometry.width} ${geometry.height}`} role="img">
      {children}
    </svg>
    {afterSvg}
  </div>
}

interface FretboardGridProps {
  readonly geometry: FretboardGeometry
  /** Canonical model tuning, ordered low to high. */
  readonly tuning: readonly Pitch[]
  readonly stringOpacity?: (string: number) => number
  readonly stringStroke?: string
  readonly stringStrokeWidth?: number
  readonly stringStrokeIncrement?: number
  readonly fretStroke?: string
  readonly neckClassName?: string
  readonly fretClassName?: string
  readonly stringClassName?: string
}

/** No musical knowledge: neck, inlays, wires, strings, and their physical labels. */
export function FretboardGrid({
  geometry: g, tuning, stringOpacity, stringStroke = '#a6a99f', stringStrokeWidth = 0.8,
  stringStrokeIncrement = 0.2, fretStroke = '#c6c7bd', neckClassName, fretClassName, stringClassName,
}: FretboardGridProps) {
  return <>
    <rect x={g.nutX} y={g.boardTop} width={g.boardWidth} height={Math.max(1, g.boardHeight)} fill="#f3f1eb" className={neckClassName} />
    {g.markers.map(marker => <g key={marker.fret} fill="#d3d1c7" aria-hidden="true">
      {marker.ys.map((y, index) => <circle key={index} cx={marker.x} cy={y} r="4" />)}
    </g>)}
    {g.frets.map(fret => <g key={fret}>
      {fret > 0 && <line x1={g.fretEndX(fret)} x2={g.fretEndX(fret)} y1={g.boardTop} y2={g.boardBottom} stroke={fretStroke} className={fretClassName} />}
      <text x={g.fretX(fret)} y={g.fretLabelY} textAnchor="middle" className="fret-label">{fret}</text>
    </g>)}
    {[...tuning].reverse().map((note, index) => {
      const string = index + 1
      const y = g.stringY(string)
      return <g key={string} opacity={stringOpacity?.(string)}>
        <line x1={g.stringStartX} x2={g.endX} y1={y} y2={y} stroke={stringStroke} strokeWidth={stringStrokeWidth + index * stringStrokeIncrement} className={stringClassName} />
        <text x="9" y={y + 5} className="string-label">{displayNote(note.name)}<tspan dx="5" className="string-number">({string})</tspan></text>
      </g>
    })}
    <line x1={g.nutX} x2={g.nutX} y1={g.boardTop - g.nutOverhang} y2={g.boardBottom + g.nutOverhang} stroke="#464c42" strokeWidth="5" />
  </>
}
