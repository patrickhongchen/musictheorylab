import { useId, useMemo } from 'react'
import type { BluesChord, BluesChordTone, BluesFretboardModel, BluesScaleTone } from '../music/blues'
import type { PitchClass } from '../music/types'
import { displayNote } from '../presentation/notes'

export type BluesLabelMode = 'notes' | 'degrees'

interface TransitionPosition {
  readonly string: number
  readonly fret: number
  readonly pitchClass: PitchClass
  readonly scaleTone?: BluesScaleTone
  readonly currentTone?: BluesChordTone
  readonly nextTone?: BluesChordTone
}

function mergePositions(currentModel: BluesFretboardModel, nextModel: BluesFretboardModel) {
  const byLocation = new Map<string, TransitionPosition>()
  currentModel.positions.forEach(position => {
    byLocation.set(`${position.string}-${position.fret}`, {
      string: position.string,
      fret: position.fret,
      pitchClass: position.pitchClass,
      scaleTone: position.scaleTone,
      currentTone: position.chordTone,
    })
  })
  nextModel.positions.forEach(position => {
    const key = `${position.string}-${position.fret}`
    const existing = byLocation.get(key)
    byLocation.set(key, {
      string: position.string,
      fret: position.fret,
      pitchClass: existing?.pitchClass ?? position.pitchClass,
      scaleTone: existing?.scaleTone ?? position.scaleTone,
      currentTone: existing?.currentTone,
      nextTone: position.chordTone,
    })
  })
  return [...byLocation.values()].sort((left, right) => left.string - right.string || left.fret - right.fret)
}

function positionKind(position: TransitionPosition, showNextChord: boolean) {
  if (!showNextChord) return position.currentTone ? 'current' : 'scale'
  if (position.currentTone && position.nextTone) return 'shared'
  if (position.nextTone) return 'next'
  if (position.currentTone) return 'current'
  return 'scale'
}

function spokenRole(position: TransitionPosition, currentChord: BluesChord, nextChord: BluesChord) {
  if (position.currentTone && position.nextTone) {
    return `shared tone: ${position.currentTone.label} of ${displayNote(currentChord.name)} and ${position.nextTone.label} of ${displayNote(nextChord.name)}`
  }
  if (position.nextTone) return `${position.nextTone.label} of next chord ${displayNote(nextChord.name)}`
  if (position.currentTone) return `${position.currentTone.label} of current chord ${displayNote(currentChord.name)}`
  return 'home blues-scale tone'
}

export function BluesFretboardView({
  currentModel,
  nextModel,
  currentChord,
  nextChord,
  labelMode,
  showNextChord,
}: {
  readonly currentModel: BluesFretboardModel
  readonly nextModel: BluesFretboardModel
  readonly currentChord: BluesChord
  readonly nextChord: BluesChord
  readonly labelMode: BluesLabelMode
  readonly showNextChord: boolean
}) {
  const titleId = useId()
  const descriptionId = useId()
  const arrowId = useId().replaceAll(':', '')
  const positions = useMemo(() => mergePositions(currentModel, nextModel), [currentModel, nextModel])
  const fretCount = currentModel.fretEnd - currentModel.fretStart + 1
  const left = 108
  const right = left + fretCount * 68
  const viewWidth = right + 18
  const columnWidth = (right - left) / fretCount
  const fretX = (fret: number) => left + (fret - currentModel.fretStart + 0.5) * columnWidth
  const stringY = (string: number) => 58 + (string - 1) * 38

  const paths = useMemo(() => {
    const currentGuides = currentChord.tones.filter(tone => tone.role === 'third' || tone.role === 'seventh')
    const nextGuides = nextChord.tones.filter(tone => tone.role === 'third' || tone.role === 'seventh')
    const candidates = currentGuides.flatMap(from => nextGuides.flatMap(to => {
      const signedDistance = ((to.pitchClass.chroma - from.pitchClass.chroma + 18) % 12) - 6
      return positions.flatMap(position => {
        if (position.currentTone?.pitchClass.chroma !== from.pitchClass.chroma) return []
        const targetFret = position.fret + signedDistance
        const target = positions.find(candidate => (
          candidate.string === position.string
          && candidate.fret === targetFret
          && candidate.nextTone?.pitchClass.chroma === to.pitchClass.chroma
        ))
        if (!target) return []
        return [{ from: position, to: target, distance: Math.abs(signedDistance) }]
      })
    }))
    return candidates
      .sort((leftPath, rightPath) => leftPath.distance - rightPath.distance || leftPath.from.string - rightPath.from.string)
      .filter((path, index, all) => all.findIndex(other => (
        other.from.currentTone?.role === path.from.currentTone?.role
        && Math.floor(other.from.fret / 5) === Math.floor(path.from.fret / 5)
      )) === index)
  }, [currentChord, nextChord, positions])

  return <div className="transition-fretboard-scroll" tabIndex={0} role="region" aria-label="Full-neck chord transition fretboard, scroll horizontally to explore all 22 frets">
    <svg className="transition-fretboard" style={{ minWidth: viewWidth }} viewBox={`0 0 ${viewWidth} 320`} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
      <title id={titleId}>{showNextChord ? `${displayNote(currentChord.name)} to ${displayNote(nextChord.name)} chord-tone movement` : `${displayNote(currentChord.name)} chord tones and home blues scale`} on guitar</title>
      <desc id={descriptionId}>
        Frets {currentModel.fretStart} through {currentModel.fretEnd}. Faint dots show the home blues scale and solid green markers show current-chord tones. {showNextChord ? 'The next-chord overlay is on: dark outlines show tones shared by both chords and orange outlines show next-chord targets.' : 'The next-chord overlay is off.'} {positions.filter(position => position.currentTone || (showNextChord && position.nextTone)).map(position => `String ${position.string} fret ${position.fret}: ${displayNote(position.pitchClass.name)}, ${showNextChord ? spokenRole(position, currentChord, nextChord) : `${position.currentTone?.label} of current chord ${displayNote(currentChord.name)}`}`).join('; ')}.
      </desc>

      <defs>
        <marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path className="transition-arrowhead" d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>

      <rect x={left} y="39" width={right - left} height="209" className="transition-neck" />
      {Array.from({ length: fretCount + 1 }, (_, index) => <line key={index} x1={left + index * columnWidth} x2={left + index * columnWidth} y1="39" y2="248" className="transition-fret-wire" />)}
      {[...currentModel.tuning].reverse().map((note, index) => <g key={note.scientific}>
        <line x1={left} x2={right} y1={stringY(index + 1)} y2={stringY(index + 1)} className="transition-string" style={{ strokeWidth: 0.8 + index * 0.18 }} />
        <text x="9" y={stringY(index + 1) + 5} className="string-label">{displayNote(note.name)}<tspan dx="5" className="string-number">({index + 1})</tspan></text>
      </g>)}
      {Array.from({ length: fretCount }, (_, index) => {
        const fret = currentModel.fretStart + index
        return <text key={fret} x={fretX(fret)} y="278" textAnchor="middle" className="fret-label">{fret}</text>
      })}

      {showNextChord && <g className="transition-paths" aria-hidden="true">
        {paths.map((path, index) => {
          const fromX = fretX(path.from.fret)
          const toX = fretX(path.to.fret)
          const y = stringY(path.from.string)
          const bend = index % 2 === 0 ? -28 : 28
          return <path key={`${path.from.string}-${path.from.fret}-${path.to.fret}`} d={`M ${fromX + Math.sign(toX - fromX) * 18} ${y} Q ${(fromX + toX) / 2} ${y + bend} ${toX - Math.sign(toX - fromX) * 18} ${y}`} markerEnd={`url(#${arrowId})`} />
        })}
      </g>}

      {positions.filter(position => showNextChord || position.currentTone || position.scaleTone).map(position => {
        const kind = positionKind(position, showNextChord)
        const tone = kind === 'next' ? position.nextTone : kind === 'current' ? position.currentTone : position.nextTone ?? position.currentTone
        const label = labelMode === 'notes' ? displayNote(position.pitchClass.name) : displayNote(tone?.label ?? position.scaleTone?.label ?? '')
        return <g key={`${position.string}-${position.fret}`} className={`transition-position is-${kind}`} transform={`translate(${fretX(position.fret)}, ${stringY(position.string)})`}>
          <circle className="transition-marker" r={kind === 'scale' ? 4.5 : 14} />
          {kind !== 'scale' && <text textAnchor="middle" dominantBaseline="central" className="transition-label">{label}</text>}
        </g>
      })}
    </svg>
  </div>
}
