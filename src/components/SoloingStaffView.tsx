import { useEffect, useMemo, useRef, useState } from 'react'
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow/bravura'
import type { SoloingStaffModel, SoloingStaffTone } from '../music/soloing'
import { displayNote } from '../presentation/notes'

const SCALE_COLOR = '#858d85'
const CURRENT_COLOR = '#22685b'
const NEXT_COLOR = '#b55c2a'

function vexKey(tone: SoloingStaffTone) {
  const { pitch } = tone
  return `${pitch.letter.toLowerCase()}${pitch.accidental}/${pitch.octave}`
}

function toneDegree(tone: SoloingStaffTone) {
  return tone.scaleTone?.label ?? tone.currentChordTone?.label ?? tone.nextChordTone?.label ?? ''
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

function appendRing(svg: SVGSVGElement, x: number, y: number, radius: number, dashed: boolean) {
  const ring = document.createElementNS(svg.namespaceURI, 'ellipse')
  ring.setAttribute('cx', String(x))
  ring.setAttribute('cy', String(y))
  ring.setAttribute('rx', String(radius))
  ring.setAttribute('ry', String(radius - 1.5))
  ring.setAttribute('fill', 'none')
  ring.setAttribute('stroke', NEXT_COLOR)
  ring.setAttribute('stroke-width', dashed ? '2' : '2.4')
  if (dashed) {
    ring.setAttribute('stroke-dasharray', '3 3')
    ring.setAttribute('stroke-linecap', 'round')
  }
  svg.append(ring)
}

function describeTone(tone: SoloingStaffTone, showNextChord: boolean) {
  const roles: string[] = []
  if (tone.isScaleTone) roles.push(`degree ${displayNote(tone.scaleTone?.label ?? '')} of the selected scale`)
  if (tone.isCurrentChordTone) roles.push(`degree ${displayNote(tone.currentChordTone?.label ?? '')} of the current chord`)
  if (showNextChord && tone.isNextChordTone) roles.push(`degree ${displayNote(tone.nextChordTone?.label ?? '')} of the next chord`)
  if (tone.isOutsideScale) roles.push('outside the selected scale')
  return `${displayNote(tone.pitch.scientific)}: ${roles.join(', ')}`
}

export interface SoloingStaffViewProps {
  readonly model: SoloingStaffModel
  readonly showNextChord?: boolean
}

/**
 * Engraves the already-classified staff model. Pitch placement and membership are
 * deliberately supplied by the music engine rather than inferred in this view.
 */
export default function SoloingStaffView({ model, showNextChord = false }: SoloingStaffViewProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)

  const outsideTones = useMemo(() => model.outsideChordTones.filter(tone => (
    tone.isCurrentChordTone || (showNextChord && tone.isNextChordTone)
  )), [model.outsideChordTones, showNextChord])
  const visibleTones = useMemo(
    () => [...model.scaleTones, ...outsideTones],
    [model.scaleTones, outsideTones],
  )

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
        const color = tone.isCurrentChordTone ? CURRENT_COLOR : SCALE_COLOR
        note.setKeyStyle(0, { fillStyle: color, strokeStyle: color, lineWidth: 1.4 })
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

        // An orange outline means the pitch is available in the next chord.
        if (showNextChord && tone.isNextChordTone) appendRing(svg, x, y, 10.5, false)
        // A wider dashed outline flags a chord tone that the selected scale omits.
        if (tone.isOutsideScale) appendRing(svg, x, y, 14, true)

        appendText(svg, x, 189, displayNote(toneDegree(tone)), {
          color: tone.isOutsideScale ? NEXT_COLOR : tone.isCurrentChordTone ? CURRENT_COLOR : SCALE_COLOR,
          family: "Georgia, 'Times New Roman', serif",
          size: 17,
          weight: tone.isCurrentChordTone ? '700' : undefined,
        })
        appendText(svg, x, 211, displayNote(tone.pitch.scientific), {
          color: '#656961',
          family: 'system-ui, sans-serif',
          size: 11,
        })
      })

      if (outsideTones.length > 0) {
        const firstOutsideIndex = model.scaleTones.length
        const beforeX = notes[firstOutsideIndex - 1].getNoteHeadBeginX() + 4
        const outsideX = notes[firstOutsideIndex].getNoteHeadBeginX() + 4
        const dividerX = (beforeX + outsideX) / 2
        const divider = document.createElementNS(svg.namespaceURI, 'line')
        divider.setAttribute('x1', String(dividerX))
        divider.setAttribute('x2', String(dividerX))
        divider.setAttribute('y1', '46')
        divider.setAttribute('y2', '166')
        divider.setAttribute('stroke', '#c5a486')
        divider.setAttribute('stroke-width', '1')
        divider.setAttribute('stroke-dasharray', '3 4')
        svg.append(divider)
        appendText(svg, (outsideX + width - 20) / 2, 24, 'Chord tones outside scale', {
          color: NEXT_COLOR,
          family: 'system-ui, sans-serif',
          size: 10,
          weight: '600',
        })
      }

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
  }, [model, outsideTones.length, showNextChord, visibleTones])

  const nextDescription = showNextChord && model.nextChord
    ? ` Orange outlines mark tones in the next chord, ${displayNote(model.nextChord.name)}.`
    : ''
  const description = `${displayNote(model.scale.name)}, ascending from tonic to tonic. Solid teal notes belong to the current chord, ${displayNote(model.currentChord.name)}. Dashed orange notes are chord tones outside the selected scale.${nextDescription} ${visibleTones.map(tone => describeTone(tone, showNextChord)).join('; ')}.`

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
