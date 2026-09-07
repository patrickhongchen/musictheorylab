import { useId } from 'react'
import type { SoloingChord, SoloingFretboardModel, SoloingFretPosition, SoloingScale } from '../music/soloing'
import { displayNote } from '../presentation/notes'

export type SoloingLabelMode = 'notes' | 'degrees'

const CURRENT_COLOR = '#22685b'
const NEXT_COLOR = '#b55c2a'
const SCALE_COLOR = '#252925'
const PAPER_COLOR = '#faf9f6'

function isVisible(position: SoloingFretPosition, showNextChord: boolean) {
  return Boolean(position.scaleTone || position.currentChordTone || (showNextChord && position.nextChordTone))
}

function markerLabel(position: SoloingFretPosition, labelMode: SoloingLabelMode, showNextChord: boolean) {
  if (labelMode === 'notes') return displayNote(position.pitchClass.name)
  const tone = position.currentChordTone ?? (showNextChord ? position.nextChordTone : undefined) ?? position.scaleTone
  return displayNote(tone?.label ?? '')
}

function spokenRole(position: SoloingFretPosition, currentChord: SoloingChord, nextChord: SoloingChord | undefined, showNextChord: boolean) {
  const roles: string[] = []
  if (position.scaleTone) roles.push(`degree ${displayNote(position.scaleTone.label)} of the selected scale`)
  if (position.currentChordTone) roles.push(`degree ${displayNote(position.currentChordTone.label)} of current chord ${displayNote(currentChord.name)}`)
  if (showNextChord && nextChord && position.nextChordTone) roles.push(`degree ${displayNote(position.nextChordTone.label)} of next chord ${displayNote(nextChord.name)}`)
  if (position.isOutsideScale) roles.push('outside the selected scale')
  return roles.join(', ')
}

interface LegendMarkerProps {
  readonly kind: 'scale' | 'current' | 'next' | 'outside'
}

function LegendMarker({ kind }: LegendMarkerProps) {
  const common = { display: 'block', width: 15, height: 15, borderRadius: '50%' }
  if (kind === 'scale') return <i aria-hidden="true" style={{ ...common, background: PAPER_COLOR, border: `2px solid ${SCALE_COLOR}` }} />
  if (kind === 'current') return <i aria-hidden="true" style={{ ...common, background: CURRENT_COLOR }} />
  if (kind === 'next') return <i aria-hidden="true" style={{ ...common, background: PAPER_COLOR, border: `2px solid ${NEXT_COLOR}` }} />
  return <i aria-hidden="true" style={{ ...common, background: CURRENT_COLOR, border: `2px solid ${NEXT_COLOR}`, outline: `2px solid ${PAPER_COLOR}`, outlineOffset: -4 }} />
}

export function SoloingVisualLegend({ showNextChord = false }: { readonly showNextChord?: boolean }) {
  const items = [
    { kind: 'scale' as const, label: 'Scale tone', detail: 'Black outline' },
    { kind: 'current' as const, label: 'Current chord', detail: 'Solid green' },
    ...(showNextChord ? [{ kind: 'next' as const, label: 'Next chord', detail: 'Orange outline' }] : []),
    { kind: 'outside' as const, label: 'Outside scale', detail: 'Green + orange ring' },
  ]
  return <div className="transition-legend" aria-label="Soloing visualization legend">
    {items.map(item => <span key={item.kind}>
      <LegendMarker kind={item.kind} />
      <b>{item.label}</b>
      <small>{item.detail}</small>
    </span>)}
  </div>
}

export interface SoloingFretboardViewProps {
  readonly model: SoloingFretboardModel
  readonly scale: SoloingScale
  readonly currentChord: SoloingChord
  readonly nextChord?: SoloingChord
  readonly labelMode: SoloingLabelMode
  readonly showNextChord?: boolean
}

/** A pure SVG adapter for the fully classified model from the soloing engine. */
export function SoloingFretboardView({
  model,
  scale,
  currentChord,
  nextChord,
  labelMode,
  showNextChord = false,
}: SoloingFretboardViewProps) {
  const titleId = useId()
  const descriptionId = useId()
  const step = 62
  const nut = 110
  const openX = 76
  const end = nut + model.fretEnd * step
  const viewWidth = end + 24
  const fretX = (fret: number) => fret === 0 ? openX : nut + (fret - 0.5) * step
  const stringY = (string: number) => 46 + (string - 1) * 36
  const visiblePositions = model.positions.filter(position => isVisible(position, showNextChord))
  const fretNumbers = Array.from({ length: model.fretEnd - model.fretStart + 1 }, (_, index) => model.fretStart + index)

  return <div className="transition-fretboard-scroll fretboard-scroll" tabIndex={0} role="region" aria-label="Full guitar fretboard, scroll horizontally to explore frets zero through twenty-two">
    <svg
      className="transition-fretboard fretboard"
      style={{ minWidth: viewWidth }}
      viewBox={`0 0 ${viewWidth} 286`}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>{displayNote(currentChord.name)} chord tones over {displayNote(scale.name)} on guitar</title>
      <desc id={descriptionId}>
        High E is at the top and low E is at the bottom. Frets {model.fretStart} through {model.fretEnd}. White circles with black borders are selected-scale tones outside the current chord. Solid green markers are current-chord tones. An orange ring around a green marker means that chord tone falls outside the selected scale. {showNextChord && nextChord ? `Orange outlines also show tones in the next chord, ${displayNote(nextChord.name)}.` : 'The next-chord overlay is off.'} Labels show {labelMode === 'notes' ? 'note names' : 'degrees'}. {visiblePositions.map(position => `String ${position.string} fret ${position.fret}: ${displayNote(position.pitchClass.name)}, ${spokenRole(position, currentChord, nextChord, showNextChord)}`).join('; ')}.
      </desc>

      <rect x={nut} y="46" width={end - nut} height="180" className="transition-neck" fill="#f3f1eb" />
      {[3, 5, 7, 9, 12, 15, 17, 19, 21].filter(fret => fret >= model.fretStart && fret <= model.fretEnd).map(fret => <g key={fret} fill="#d3d1c7" aria-hidden="true">
        {fret === 12
          ? <><circle cx={fretX(fret)} cy="100" r="4" /><circle cx={fretX(fret)} cy="172" r="4" /></>
          : <circle cx={fretX(fret)} cy="136" r="4" />}
      </g>)}
      {fretNumbers.filter(fret => fret > 0).map(fret => <line
        key={fret}
        x1={nut + fret * step}
        x2={nut + fret * step}
        y1="46"
        y2="226"
        className="transition-fret-wire"
        stroke="#bfc2b8"
      />)}
      {[...model.tuning].reverse().map((note, index) => <g key={note.scientific}>
        <line x1="55" x2={end} y1={stringY(index + 1)} y2={stringY(index + 1)} className="transition-string" stroke="#8f948b" strokeWidth={0.8 + index * 0.18} />
        <text x="9" y={stringY(index + 1) + 5} className="string-label">{displayNote(note.name)}<tspan dx="5" className="string-number">({index + 1})</tspan></text>
      </g>)}
      <line x1={nut} x2={nut} y1="44" y2="228" stroke="#464c42" strokeWidth="5" />
      {fretNumbers.map(fret => <text key={fret} x={fretX(fret)} y="260" textAnchor="middle" className="fret-label">{fret}</text>)}

      {visiblePositions.map(position => {
        const isCurrent = Boolean(position.currentChordTone)
        const isNext = showNextChord && Boolean(position.nextChordTone)
        const isScale = Boolean(position.scaleTone)
        const isCurrentOutsideScale = isCurrent && !isScale
        const hasOrangeRing = isCurrentOutsideScale || isNext
        const label = markerLabel(position, labelMode, showNextChord)
        const x = fretX(position.fret)
        const y = stringY(position.string)

        return <g key={`${position.string}-${position.fret}`} className="transition-position" transform={`translate(${x}, ${y})`}>
          <circle
            className="transition-marker"
            r={isCurrent ? 14 : 12}
            fill={isCurrent ? CURRENT_COLOR : PAPER_COLOR}
            stroke={isCurrent ? CURRENT_COLOR : isScale ? SCALE_COLOR : NEXT_COLOR}
            strokeWidth="2.2"
          />
          {hasOrangeRing && <circle
            r="17"
            fill="none"
            stroke={NEXT_COLOR}
            strokeWidth="2.4"
          />}
          <text
            textAnchor="middle"
            dominantBaseline="central"
            className="transition-label"
            fill={isCurrent ? '#fff' : isScale ? SCALE_COLOR : NEXT_COLOR}
            fontSize="10"
            fontWeight="700"
          >{label}</text>
        </g>
      })}
    </svg>
  </div>
}
