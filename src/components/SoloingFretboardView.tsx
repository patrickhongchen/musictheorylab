import { useId } from 'react'
import type { SoloingChord, SoloingFretboardModel, SoloingFretPosition, SoloingScale } from '../music/soloing'
import { displayNote } from '../presentation/notes'
import type { SoloingNoteFilter } from './soloingVisualTypes'

export type SoloingLabelMode = 'notes' | 'degrees'

const CURRENT_COLOR = '#176b5b'
const CURRENT_FILL = '#d8eee7'
const OUTSIDE_COLOR = '#c56a1a'
const NEXT_COLOR = '#4666b0'
const SCALE_COLOR = '#252925'
const PAPER_COLOR = '#faf9f6'

function isVisible(position: SoloingFretPosition, showNextChord: boolean, noteFilter: SoloingNoteFilter) {
  if (noteFilter === 'scale') return Boolean(position.scaleTone)
  if (noteFilter === 'chord') return Boolean(position.currentChordTone || (showNextChord && position.nextChordTone))
  return Boolean(position.scaleTone || position.currentChordTone || (showNextChord && position.nextChordTone))
}

function markerLabel(position: SoloingFretPosition, labelMode: SoloingLabelMode, showNextChord: boolean, noteFilter: SoloingNoteFilter) {
  if (labelMode === 'notes') return displayNote(position.pitchClass.name)
  const tone = noteFilter === 'scale'
    ? position.scaleTone
    : position.currentChordTone ?? (showNextChord ? position.nextChordTone : undefined) ?? position.scaleTone
  return displayNote(tone?.label ?? '')
}

function spokenRole(position: SoloingFretPosition, currentChord: SoloingChord, nextChord: SoloingChord | undefined, showNextChord: boolean, noteFilter: SoloingNoteFilter) {
  const roles: string[] = []
  if (noteFilter !== 'chord' && position.scaleTone) roles.push(`degree ${displayNote(position.scaleTone.label)} of the selected scale`)
  if (noteFilter !== 'scale' && position.currentChordTone) roles.push(`degree ${displayNote(position.currentChordTone.label)} of current chord ${displayNote(currentChord.name)}`)
  if (noteFilter !== 'scale' && showNextChord && nextChord && position.nextChordTone) roles.push(`degree ${displayNote(position.nextChordTone.label)} of next chord ${displayNote(nextChord.name)}`)
  if (noteFilter !== 'scale' && position.isOutsideScale) roles.push('outside the selected scale')
  return roles.join(', ')
}

interface LegendMarkerProps {
  readonly kind: 'scale' | 'current' | 'next' | 'outside'
}

function LegendMarker({ kind }: LegendMarkerProps) {
  const current = kind === 'current'
  return <svg aria-hidden="true" width="19" height="19" viewBox="0 0 19 19">
    {kind === 'next' && <circle cx="9.5" cy="9.5" r="8" fill="none" stroke={NEXT_COLOR} strokeWidth="1.8" strokeDasharray="3 2" />}
    <circle
      cx="9.5"
      cy="9.5"
      r="6"
      fill={current ? CURRENT_FILL : PAPER_COLOR}
      stroke={current ? CURRENT_COLOR : SCALE_COLOR}
      strokeWidth={current ? 2.4 : 1.7}
    />
    {kind === 'outside' && <rect x="12.1" y="2.6" width="4.8" height="4.8" rx=".7" fill={OUTSIDE_COLOR} stroke={PAPER_COLOR} strokeWidth="1" transform="rotate(45 14.5 5)" />}
  </svg>
}

export function SoloingVisualLegend({ showNextChord = false, noteFilter = 'both' }: { readonly showNextChord?: boolean; readonly noteFilter?: SoloingNoteFilter }) {
  const items = noteFilter === 'scale'
    ? [{ kind: 'scale' as const, label: 'Scale tone', detail: 'Ink outline' }]
    : [
      ...(noteFilter === 'both' ? [{ kind: 'scale' as const, label: 'Scale tone', detail: 'Ink outline' }] : []),
      { kind: 'current' as const, label: 'Current chord', detail: 'Mint + green' },
      { kind: 'outside' as const, label: 'Outside scale', detail: 'Amber diamond' },
      ...(showNextChord ? [{ kind: 'next' as const, label: 'Next chord', detail: 'Blue dashed halo' }] : []),
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
  readonly noteFilter?: SoloingNoteFilter
}

/** A pure SVG adapter for the fully classified model from the soloing engine. */
export function SoloingFretboardView({
  model,
  scale,
  currentChord,
  nextChord,
  labelMode,
  showNextChord = false,
  noteFilter = 'both',
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
  const visiblePositions = model.positions.filter(position => isVisible(position, showNextChord, noteFilter))
  const fretNumbers = Array.from({ length: model.fretEnd - model.fretStart + 1 }, (_, index) => model.fretStart + index)
  const markerDescription = noteFilter === 'scale'
    ? 'Paper circles with ink borders are selected-scale tones.'
    : noteFilter === 'chord'
      ? 'Mint circles with heavy green borders are current-chord tones. An amber diamond marks a chord tone outside the selected scale.'
      : 'Paper circles with ink borders are selected-scale tones outside the current chord. Mint circles with heavy green borders are current-chord tones. An amber diamond marks a chord tone outside the selected scale.'

  return <div className="transition-fretboard-scroll fretboard-scroll" tabIndex={0} role="region" aria-label="Full guitar fretboard, scroll horizontally to explore frets zero through twenty-two">
    <svg
      className="transition-fretboard fretboard"
      style={{ minWidth: viewWidth }}
      viewBox={`0 0 ${viewWidth} 286`}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>{noteFilter === 'scale' ? displayNote(scale.name) : noteFilter === 'chord' ? `${displayNote(currentChord.name)} chord tones` : `${displayNote(currentChord.name)} chord tones over ${displayNote(scale.name)}`} on guitar</title>
      <desc id={descriptionId}>
        High E is at the top and low E is at the bottom. Frets {model.fretStart} through {model.fretEnd}. The view is filtered to {noteFilter === 'both' ? 'scale and chord tones' : noteFilter === 'chord' ? 'chord tones' : 'scale tones'}. All note markers are the same size. {markerDescription} {showNextChord && nextChord ? `Blue dashed halos show tones in the next chord, ${displayNote(nextChord.name)}.` : noteFilter === 'scale' ? 'Chord overlays are hidden in Scale view.' : 'The next-chord overlay is off.'} Labels show {labelMode === 'notes' ? 'note names' : 'degrees'}. {visiblePositions.map(position => `String ${position.string} fret ${position.fret}: ${displayNote(position.pitchClass.name)}, ${spokenRole(position, currentChord, nextChord, showNextChord, noteFilter)}`).join('; ')}.
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
        const isCurrent = noteFilter !== 'scale' && Boolean(position.currentChordTone)
        const isNext = noteFilter !== 'scale' && showNextChord && Boolean(position.nextChordTone)
        const isScale = Boolean(position.scaleTone)
        const isOutsideScale = noteFilter !== 'scale' && !isScale
        const label = markerLabel(position, labelMode, showNextChord, noteFilter)
        const x = fretX(position.fret)
        const y = stringY(position.string)

        return <g key={`${position.string}-${position.fret}`} className="transition-position" transform={`translate(${x}, ${y})`}>
          <circle
            className="transition-marker"
            r="13"
            fill={isCurrent ? CURRENT_FILL : PAPER_COLOR}
            stroke={isCurrent ? CURRENT_COLOR : isScale ? SCALE_COLOR : OUTSIDE_COLOR}
            strokeWidth={isCurrent ? 3 : 1.8}
          />
          {isNext && <circle
            r="17"
            fill="none"
            stroke={NEXT_COLOR}
            strokeWidth="2.2"
            strokeDasharray="4 3"
          />}
          {isOutsideScale && <rect
            x="8"
            y="-16"
            width="7"
            height="7"
            rx="1"
            fill={OUTSIDE_COLOR}
            stroke={PAPER_COLOR}
            strokeWidth="1.5"
            transform="rotate(45 11.5 -12.5)"
          />}
          <text
            textAnchor="middle"
            dominantBaseline="central"
            className="transition-label"
            fill={SCALE_COLOR}
            fontSize="10.5"
            fontWeight="700"
          >{label}</text>
        </g>
      })}
    </svg>
  </div>
}
