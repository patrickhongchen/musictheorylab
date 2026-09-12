import { useId } from 'react'
import type { SoloingChord, SoloingFretboardModel, SoloingFretPosition, SoloingScale } from '../music/soloing'
import { displayNote } from '../presentation/notes'
import { FretboardCanvas, FretboardGrid } from './fretboard/FretboardCanvas'
import { createFretboardGeometry } from './fretboard/fretboardGeometry'
import { SOLOING_VISUAL_COLORS, type SoloingNoteFilter } from './soloingVisualTypes'

export type SoloingLabelMode = 'notes' | 'degrees'

const CURRENT_COLOR = SOLOING_VISUAL_COLORS.current
const CURRENT_FILL = SOLOING_VISUAL_COLORS.currentFill
const OUTSIDE_COLOR = SOLOING_VISUAL_COLORS.outside
const NEXT_COLOR = SOLOING_VISUAL_COLORS.next
const SCALE_COLOR = SOLOING_VISUAL_COLORS.scale
const PAPER_COLOR = SOLOING_VISUAL_COLORS.paper

function isVisible(position: SoloingFretPosition, showNextChord: boolean, noteFilter: SoloingNoteFilter) {
  if (noteFilter === 'scale') return Boolean(position.scaleTone)
  if (noteFilter === 'chord') return Boolean(position.currentChordTone || (showNextChord && position.nextChordTone))
  return Boolean(position.scaleTone || position.currentChordTone || (showNextChord && position.nextChordTone))
}

function markerLabel(position: SoloingFretPosition, labelMode: SoloingLabelMode) {
  if (labelMode === 'notes') return displayNote(position.pitchClass.name)
  return displayNote(position.scaleDegreeLabel)
}

function spokenRole(position: SoloingFretPosition, currentChord: SoloingChord, nextChord: SoloingChord | undefined, showNextChord: boolean, noteFilter: SoloingNoteFilter) {
  const roles: string[] = [`scale-relative degree ${displayNote(position.scaleDegreeLabel)}`]
  if (noteFilter !== 'chord' && position.scaleTone) roles.push('selected scale tone')
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
    {items.map(item => <span key={item.kind} aria-label={`${item.label}: ${item.detail}`}>
      <LegendMarker kind={item.kind} />
      <b>{item.label}</b>
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
  const geometry = createFretboardGeometry({
    fretCount: model.fretEnd,
    fretStart: model.fretStart,
    fretStep: 62,
    nutX: 110,
    openX: 76,
    stringCount: model.tuning.length,
    boardTop: 46,
    stringSpacing: 36,
    fretLabelOffset: 34,
    bottomPadding: 26,
    nutOverhang: 2,
  })
  const visiblePositions = model.positions.filter(position => isVisible(position, showNextChord, noteFilter))
  const markerDescription = noteFilter === 'scale'
    ? 'Paper circles with ink borders are selected-scale tones.'
    : noteFilter === 'chord'
      ? 'Mint circles with heavy green borders are current-chord tones. An amber diamond marks a chord tone outside the selected scale.'
      : 'Paper circles with ink borders are selected-scale tones outside the current chord. Mint circles with heavy green borders are current-chord tones. An amber diamond marks a chord tone outside the selected scale.'

  return <FretboardCanvas
    geometry={geometry}
    scrollLabel="Full guitar fretboard, scroll horizontally to explore frets zero through twenty-two"
    scrollClassName="transition-fretboard-scroll fretboard-scroll"
    svgProps={{
      className: 'transition-fretboard fretboard',
      'aria-labelledby': `${titleId} ${descriptionId}`,
    }}
  >
      <title id={titleId}>{noteFilter === 'scale' ? displayNote(scale.name) : noteFilter === 'chord' ? `${displayNote(currentChord.name)} chord tones` : `${displayNote(currentChord.name)} chord tones over ${displayNote(scale.name)}`} on guitar</title>
      <desc id={descriptionId}>
        High E is at the top and low E is at the bottom. Frets {model.fretStart} through {model.fretEnd}. The view is filtered to {noteFilter === 'both' ? 'scale and chord tones' : noteFilter === 'chord' ? 'chord tones' : 'scale tones'}. All note markers are the same size. {markerDescription} {showNextChord && nextChord ? `Blue dashed halos show tones in the next chord, ${displayNote(nextChord.name)}.` : noteFilter === 'scale' ? 'Chord overlays are hidden in Scale view.' : 'The next-chord overlay is off.'} Labels show {labelMode === 'notes' ? 'note names' : 'scale-relative degrees'}. {visiblePositions.map(position => `String ${position.string} fret ${position.fret}: ${displayNote(position.pitchClass.name)}, ${spokenRole(position, currentChord, nextChord, showNextChord, noteFilter)}`).join('; ')}.
      </desc>

      <FretboardGrid
        geometry={geometry}
        tuning={model.tuning}
        fretStroke="#bfc2b8"
        stringStroke="#8f948b"
        stringStrokeIncrement={0.18}
      />

      {visiblePositions.map(position => {
        const isCurrent = noteFilter !== 'scale' && Boolean(position.currentChordTone)
        const isNext = noteFilter !== 'scale' && showNextChord && Boolean(position.nextChordTone)
        const isScale = Boolean(position.scaleTone)
        const isOutsideScale = noteFilter !== 'scale' && !isScale
        const label = markerLabel(position, labelMode)
        const x = geometry.fretX(position.fret)
        const y = geometry.stringY(position.string)

        return <g key={`${position.string}-${position.fret}`} className="transition-position" transform={`translate(${x}, ${y})`}>
          <circle
            className="transition-marker"
            r="13"
            fill={isCurrent ? CURRENT_FILL : PAPER_COLOR}
            stroke={isCurrent ? CURRENT_COLOR : isScale ? SCALE_COLOR : OUTSIDE_COLOR}
            strokeWidth={isCurrent ? 3 : 1.8}
          />
          {isNext && <circle r="17" fill="none" stroke={NEXT_COLOR} strokeWidth="2.2" strokeDasharray="4 3" />}
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
  </FretboardCanvas>
}
