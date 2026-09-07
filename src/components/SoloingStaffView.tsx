import { useEffect, useMemo, useRef, useState } from 'react'
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow/bravura'
import type { SoloingStaffModel, SoloingStaffTone } from '../music/soloing'
import { displayNote } from '../presentation/notes'
import { SOLOING_VISUAL_COLORS, type SoloingNoteFilter } from './soloingVisualTypes'

const SCALE_COLOR = SOLOING_VISUAL_COLORS.scale
const CURRENT_COLOR = SOLOING_VISUAL_COLORS.current
const OUTSIDE_COLOR = SOLOING_VISUAL_COLORS.outside
const NEXT_COLOR = SOLOING_VISUAL_COLORS.next

function vexKey(tone: SoloingStaffTone) {
  const { pitch } = tone
  return `${pitch.letter.toLowerCase()}${pitch.accidental}/${pitch.octave}`
}

function toneDegree(tone: SoloingStaffTone) {
  return tone.scaleDegreeLabel
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

function appendDegreeLabel(svg: SVGSVGElement, x: number, y: number, degree: string, color: string) {
  const displayedDegree = displayNote(degree)
  const accidental = displayedDegree.match(/^[♭♯]/)?.[0]
  const numeral = accidental ? displayedDegree.slice(accidental.length) : displayedDegree
  const options = {
    color,
    family: "Georgia, 'Times New Roman', serif",
    size: 16,
    weight: '400',
  }

  // Center the numeral itself on the notehead. Centering the full string would
  // push a flattened or sharpened degree visibly to the right of its pitch name.
  appendText(svg, x, y, numeral, options)
  if (accidental) {
    const accidentalLabel = document.createElementNS(svg.namespaceURI, 'text')
    accidentalLabel.setAttribute('x', String(x - 5))
    accidentalLabel.setAttribute('y', String(y))
    accidentalLabel.setAttribute('text-anchor', 'end')
    accidentalLabel.setAttribute('fill', color)
    accidentalLabel.setAttribute('font-family', options.family)
    accidentalLabel.setAttribute('font-size', String(options.size))
    accidentalLabel.setAttribute('font-weight', options.weight)
    accidentalLabel.textContent = accidental
    svg.append(accidentalLabel)
  }
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
  const roles: string[] = [`scale-relative degree ${displayNote(tone.scaleDegreeLabel)}`]
  if (noteFilter !== 'chord' && tone.isScaleTone) roles.push('selected scale tone')
  if (noteFilter !== 'scale' && tone.isCurrentChordTone) roles.push(`degree ${displayNote(tone.currentChordTone?.label ?? '')} of the current chord`)
  if (noteFilter !== 'scale' && showNextChord && tone.isNextChordTone) roles.push(`degree ${displayNote(tone.nextChordTone?.label ?? '')} of the next chord`)
  if (noteFilter !== 'scale' && tone.isOutsideScale) roles.push('outside the selected scale')
  return `${displayNote(tone.pitch.name)}: ${roles.join(', ')}`
}

function toneColor(tone: SoloingStaffTone, noteFilter: SoloingNoteFilter) {
  if (noteFilter === 'scale') return SCALE_COLOR
  if (tone.isCurrentChordTone) return CURRENT_COLOR
  if (tone.isOutsideScale) return OUTSIDE_COLOR
  return SCALE_COLOR
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
      const height = 196
      const renderer = new Renderer(host, Renderer.Backends.SVG)
      renderer.resize(width, height)
      const context = renderer.getContext()
      const stave = new Stave(12, 35, width - 24).addClef('treble')
      stave.setContext(context).draw()

      const notes = visibleTones.map(tone => {
        const note = new StaveNote({ keys: [vexKey(tone)], duration: 'q' })
        const color = toneColor(tone, noteFilter)
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
        const color = toneColor(tone, noteFilter)

        if (noteFilter !== 'scale' && showNextChord && tone.isNextChordTone) appendNextHalo(svg, x, y, 12)
        if (noteFilter !== 'scale' && tone.isOutsideScale) appendOutsideDiamond(svg, x + 13, 168)

        appendText(svg, x, 151, displayNote(tone.pitch.name), {
          color: SOLOING_VISUAL_COLORS.muted,
          family: "Georgia, 'Times New Roman', serif",
          size: 16,
          weight: '400',
        })
        appendDegreeLabel(svg, x, 174, toneDegree(tone), color)
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
  const description = `${displayNote(model.scale.name)}, filtered to ${noteFilter === 'both' ? 'scale and chord tones' : noteFilter === 'chord' ? 'chord tones' : 'scale tones'}, in ascending pitch order. ${markerDescription}${nextDescription} Note names sit above scale-relative degrees. ${visibleTones.map(tone => describeTone(tone, showNextChord, noteFilter)).join('; ')}.`

  return <div
    className="blues-staff-scroll scale-staff-scroll"
    tabIndex={0}
    role="region"
    aria-label="Soloing staff, scroll horizontally on small screens"
  >
    <div className="blues-scale-staff scale-staff-view" role="img" aria-label={description} style={{ minWidth: 680, minHeight: 196 }}>
      <div ref={hostRef} />
      {error && <p className="blues-staff-error" role="alert">The staff could not render. The note and degree summary remains available to assistive technology.</p>}
    </div>
  </div>
}
