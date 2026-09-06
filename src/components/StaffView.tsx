import { useEffect, useRef, useState } from 'react'
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow/bravura'
import type { Voicing } from '../music/types'
import { displayNote, ROLE_STYLE } from '../presentation/notes'

/** VexFlow is an engraving adapter only: all pitches and roles arrive resolved. */
export default function StaffView({ voicing, keySignature }: { voicing: Voicing; keySignature: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let cancelled = false
    let revision = 0
    host.replaceChildren()

    async function draw() {
      const currentRevision = ++revision
      // The Bravura entry point embeds its fonts. Wait for actual glyph metrics.
      await document.fonts.ready
      if (cancelled || currentRevision !== revision || !host) return
      host.replaceChildren()
      const width = Math.max(360, Math.min(520, host.clientWidth))
      const renderer = new Renderer(host, Renderer.Backends.SVG)
      renderer.resize(width, 190)
      const context = renderer.getContext()
      const stave = new Stave(12, 48, width - 38).addClef('treble').addKeySignature(keySignature)
      stave.setContext(context).draw()
      const chord = new StaveNote({ keys: voicing.notes.map(({ pitch }) => `${pitch.letter.toLowerCase()}${pitch.accidental}/${pitch.octave}`), duration: 'w' })
      chord.setCenterAlignment(true)
      voicing.notes.forEach((note, index) => chord.setKeyStyle(index, { fillStyle: ROLE_STYLE[note.role].color, strokeStyle: ROLE_STYLE[note.role].color }))
      const voice = new Voice({ numBeats: 4, beatValue: 4 }).addTickables([chord])
      Accidental.applyAccidentals([voice], keySignature)
      new Formatter().joinVoices([voice]).formatToStave([voice], stave)
      voice.draw(context, stave)

      const svg = host.querySelector('svg')!
      svg.setAttribute('viewBox', `0 0 ${width} 190`)
      svg.removeAttribute('width')
      svg.removeAttribute('height')
      svg.style.width = '100%'
      svg.style.height = 'auto'
      svg.setAttribute('aria-hidden', 'true')
      const x = chord.getNoteHeadBeginX() + 24
      const y = chord.getYs()[voicing.notes.length - 1]
      const annotation = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      const line = document.createElementNS(svg.namespaceURI, 'path')
      line.setAttribute('d', `M ${x} ${y} L ${x + 16} 62 L ${width - 32} 62`)
      line.setAttribute('fill', 'none')
      line.setAttribute('stroke', ROLE_STYLE[voicing.soprano.role].color)
      const label = document.createElementNS(svg.namespaceURI, 'text')
      label.setAttribute('x', String(width - 32))
      label.setAttribute('y', '53')
      label.setAttribute('text-anchor', 'end')
      label.setAttribute('fill', ROLE_STYLE[voicing.soprano.role].color)
      label.setAttribute('font-family', 'system-ui, sans-serif')
      label.setAttribute('font-size', '14')
      label.setAttribute('stroke', 'none')
      label.textContent = `${displayNote(voicing.soprano.pitch.scientific)} · top note`
      annotation.append(line, label)
      svg.append(annotation)
      setError(false)
    }
    const render = () => { void draw().catch(() => { if (!cancelled) setError(true) }) }
    const observer = new ResizeObserver(render)
    observer.observe(host)
    render()
    return () => { cancelled = true; observer.disconnect(); host.replaceChildren() }
  }, [voicing, keySignature])

  return <div className="staff-view" role="img" aria-label={`Treble staff in ${displayNote(keySignature)} major. Bass to soprano: ${voicing.notes.map(n => displayNote(n.pitch.scientific)).join(', ')}. Top note: ${displayNote(voicing.soprano.pitch.scientific)}.`}>
    <div ref={hostRef} />
    {error && <p role="alert">The staff could not render. The exact pitches are listed below.</p>}
  </div>
}
