import { useEffect, useMemo, useRef, useState } from 'react'
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow/bravura'
import type { SoloingStaffModel, SoloingStaffTone } from '../music/soloing'
import { displayNote } from '../presentation/notes'
import type { SoloingNoteFilter } from './soloingVisualTypes'

const SCALE_COLOR = '#252925'
const CURRENT_COLOR = '#176b5b'
const OUTSIDE_COLOR = '#c56a1a'
const NEXT_COLOR = '#4666b0'

function vexKey(tone: SoloingStaffTone) {
  const { pitch } = tone
  return `${pitch.letter.toLowerCase()}${pitch.accidental}/${pitch.octave}`
}

function toneDegree(tone: SoloingStaffTone, noteFilter: SoloingNoteFilter) {
  if (noteFilter === 'scale') return tone.scaleTone?.label ?? ''
  if (noteFilter === 'both') return tone.scaleTone?.label ?? tone.currentChordTone?.label ?? tone.nextChordTone?.label ?? ''
  return tone.currentChordTone?.label ?? tone.nextChordTone?.label ?? tone.scaleTone?.label ?? ''
}

function appendText(svg: SVGSVGElement, x: number, y: number, text: string, options: {
  readonly color: string
  readonly family: string
  readonly size: number
  readonly weight?: string
}) {
  const label = document.createElementNS(svg.namespaceURI, 'text')
  label.setAttribute('x', String(x))
  label.setAttribute('y', String(y))
  label.setAttribute('text-anchor', 'middle')
  label.setAttribute('fill', options.color)
  label.setAttribute('font-family', options.family)
  label.setAttribute('font-size', String(options.size))
  if (options.weight) label.setAttribute('font-weight', options.weight)
  label.textContent = text
  svg.append(label)
}

function appendNextHalo(svg: SVGSVGElement, x: number, y: number, radius: number) {
  const ring = document.createElementNS(svg.namespaceURI, 'ellipse')
  ring.setAttribute('cx', String(x))
  ring.setAttribute('cy', String(y))
  ring.setAttribute('rx', String(radius))
  ring.setAttribute('ry', String(radius - 1.5))
  ring.setAttribute('fill', 'none')
  ring.setAttribute('stroke', NEXT_COLOR)
  ring.setAttribute('stroke-width', '2.2')
  ring.setAttribute('stroke-dasharray', '4 3')
  svg.append(ring)
}

function appendOutsideDiamond(svg: SVGSVGElement, x: number, y: number) {
  const diamond = document.createElementNS(svg.namespaceURI, 'rect')
  diamond.setAttribute('x', String(x - 3.5))
  diamond.setAttribute('y', String(y - 3.5))
  diamond.setAttribute('width', '7')
  diamond.setAttribute('height', '7')
  diamond.setAttribute('rx', '1')
  diamond.setAttribute('fill', OUTSIDE_COLOR)
  diamond.setAttribute('transform', `rotate(45 ${x} ${y})`)
  svg.append(diamond)
}

function describeTone(tone: SoloingStaffTone, showNextChord: boolean, noteFilter: SoloingNoteFilter) {
  const roles: string[] = []
  if (noteFilter !== 'chord' && tone.isScaleTone) roles.push(`degree ${displayNote(tone.scaleTone?.label ?? '')} of the selected scale`)
  if (noteFilter !== 'scale' && tone.isCurrentChordTone) roles.push(`degree ${displayNote(tone.currentChordTone?.label ?? '')} of the current chord`)
  if (noteFilter !== 'scale' && showNextChord && tone.isNextChordTone) roles.push(`degree ${displayNote(tone.nextChordTone?.label ?? '')} of the next chord`)
  if (noteFilter !== 'scale' && tone.isOutsideScale) roles.push('outside the selected scale')
  return `${displayNote(tone.pitch.scientific)}: ${roles.join(', ')}`
}

export interface SoloingStaffViewProps {
  readonly model: SoloingStaffModel
  readonly showNextChord?: boolean
  readonly noteFilter?: SoloingNoteFilter
}

/**
 * Engraves the already-classified staff model. Pitch placement and membership are
 * deliberately supplied by the music engine rather than inferred in this view.
 */
export default function SoloingStaffView({ model, showNextChord = false, noteFilter = 'both' }: SoloingStaffViewProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)

  const visibleTones = useMemo(() => {
    const allTones = [...model.scaleTones, ...model.outsideChordTones]
    return allTones.filter(tone => {
      if (noteFilter === 'scale') return tone.isScaleTone
      if (noteFilter === 'chord') return tone.isCurrentChordTone || (showNextChord && tone.isNextChordTone)
      return tone.isScaleTone || tone.isCurrentChordTone || (showNextChord && tone.isNextChordTone)
    }).sort((left, right) => left.pitch.midi - right.pitch.midi)
  }, [model.outsideChordTones, model.scaleTones, noteFilter, showNextChord])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    let revision = 0
    let frame: number | undefined

    async function draw() {
      const currentRevision = ++revision
      await document.fonts.ready
      if (cancelled || currentRevision !== revision || !host) return

      host.replaceChildren()
      const width = Math.max(680, host.clientWidth, visibleTones.length * 76 + 92)
      const height = 234
      const renderer = new Renderer(host, Renderer.Backends.SVG)
      renderer.resize(width, height)
      const context = renderer.getContext()
      const stave = new Stave(12, 35, width - 24).addClef('treble')
      stave.setContext(context).draw()

      const notes = visibleTones.map(tone => {
        const note = new StaveNote({ keys: [vexKey(tone)], duration: 'q' })
        const color = noteFilter !== 'scale' && tone.isCurrentChordTone ? CURRENT_COLOR : SCALE_COLOR
        note.setKeyStyle(0, {
          fillStyle: color,
          strokeStyle: color,
          lineWidth: 1.4,
        })
        return note
      })
      const voice = new Voice({ numBeats: notes.length, beatValue: 4 }).addTickables(notes)
      Accidental.applyAccidentals([voice], 'C')
      new Formatter().joinVoices([voice]).formatToStave([voice], stave)
      voice.draw(context, stave)

      const svg = host.querySelector('svg')
      if (!svg) throw new Error('VexFlow did not produce an SVG staff')
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
      svg.removeAttribute('width')
      svg.removeAttribute('height')
      svg.style.width = '100%'
      svg.style.height = 'auto'
      svg.setAttribute('aria-hidden', 'true')

      notes.forEach((note, index) => {
        const tone = visibleTones[index]
        const x = note.getNoteHeadBeginX() + 4
        const y = note.getYs()[0]

        if (noteFilter !== 'scale' && showNextChord && tone.isNextChordTone) appendNextHalo(svg, x, y, 12)
        if (noteFilter !== 'scale' && tone.isOutsideScale) appendOutsideDiamond(svg, x + 13, 179)

        appendText(svg, x, 189, displayNote(toneDegree(tone, noteFilter)), {
          color: noteFilter !== 'scale' && tone.isCurrentChordTone ? CURRENT_COLOR : SCALE_COLOR,
          family: "Georgia, 'Times New Roman', serif",
          size: 17,
          weight: noteFilter !== 'scale' && tone.isCurrentChordTone ? '700' : undefined,
        })
        appendText(svg, x, 211, displayNote(tone.pitch.scientific), {
          color: '#656961',
          family: 'system-ui, sans-serif',
          size: 11,
        })
      })

      setError(false)
    }

    const render = () => {
      if (frame !== undefined) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        void draw().catch(() => { if (!cancelled) setError(true) })
      })
    }
    const observer = new ResizeObserver(render)
    observer.observe(host)
    render()

    return () => {
      cancelled = true
      revision++
      if (frame !== undefined) cancelAnimationFrame(frame)
      observer.disconnect()
      host.replaceChildren()
    }
  }, [model, noteFilter, showNextChord, visibleTones])

  const nextDescription = showNextChord && model.nextChord
    ? ` Blue dashed halos mark tones in the next chord, ${displayNote(model.nextChord.name)}.`
    : ''
  const markerDescription = noteFilter === 'scale'
    ? 'Black notes belong to the selected scale.'
    : noteFilter === 'chord'
      ? `Green notes belong to the current chord, ${displayNote(model.currentChord.name)}; amber diamonds mark chord tones outside the selected scale.`
      : `Black notes belong to the selected scale. Green notes belong to the current chord, ${displayNote(model.currentChord.name)}; amber diamonds mark chord tones outside the selected scale.`
  const description = `${displayNote(model.scale.name)}, filtered to ${noteFilter === 'both' ? 'scale and chord tones' : noteFilter === 'chord' ? 'chord tones' : 'scale tones'}, in ascending pitch order. ${markerDescription}${nextDescription} ${visibleTones.map(tone => describeTone(tone, showNextChord, noteFilter)).join('; ')}.`

  return <div
    className="blues-staff-scroll scale-staff-scroll"
    tabIndex={0}
    role="region"
    aria-label="Soloing staff, scroll horizontally on small screens"
  >
    <div className="blues-scale-staff scale-staff-view" role="img" aria-label={description} style={{ minWidth: 680, minHeight: 234 }}>
      <div ref={hostRef} />
      {error && <p className="blues-staff-error" role="alert">The staff could not render. The note and degree summary remains available to assistive technology.</p>}
    </div>
  </div>
}
