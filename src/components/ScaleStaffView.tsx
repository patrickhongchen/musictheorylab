import { useEffect, useRef, useState } from 'react'
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow/bravura'
import type { PentatonicScale, Pitch } from '../music/types'
import { displayNote, ROLE_STYLE } from '../presentation/notes'

const COLOR_TONE = '#656961'

function toneColor(label: string) {
  if (label === '1') return ROLE_STYLE.root.color
  if (label === '3' || label === 'b3') return ROLE_STYLE.third.color
  if (label === '5') return ROLE_STYLE.fifth.color
  return COLOR_TONE
}

function displayDegree(label: string) {
  return label.replace('b', '♭').replace('#', '♯')
}

export default function ScaleStaffView({ scale, pitches }: { scale: PentatonicScale; pitches: readonly Pitch[] }) {
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
      await document.fonts.ready
      if (cancelled || currentRevision !== revision || !host) return
      host.replaceChildren()
      const width = Math.max(620, host.clientWidth)
      const renderer = new Renderer(host, Renderer.Backends.SVG)
      renderer.resize(width, 220)
      const context = renderer.getContext()
      const stave = new Stave(12, 28, width - 24).addClef('treble')
      stave.setContext(context).draw()

      const notes = pitches.map((pitch, index) => {
        const note = new StaveNote({
          keys: [`${pitch.letter.toLowerCase()}${pitch.accidental}/${pitch.octave}`],
          duration: 'q',
        })
        const tone = scale.tones[index % scale.tones.length]
        const color = toneColor(tone.label)
        note.setKeyStyle(0, { fillStyle: color, strokeStyle: color })
        return note
      })
      const voice = new Voice({ numBeats: notes.length, beatValue: 4 }).addTickables(notes)
      Accidental.applyAccidentals([voice], 'C')
      new Formatter().joinVoices([voice]).formatToStave([voice], stave)
      voice.draw(context, stave)

      const svg = host.querySelector('svg')!
      svg.setAttribute('viewBox', `0 0 ${width} 220`)
      svg.removeAttribute('width')
      svg.removeAttribute('height')
      svg.style.width = '100%'
      svg.style.height = 'auto'
      svg.setAttribute('aria-hidden', 'true')

      notes.forEach((note, index) => {
        const tone = scale.tones[index % scale.tones.length]
        const x = note.getNoteHeadBeginX() + 4
        const degree = document.createElementNS(svg.namespaceURI, 'text')
        degree.setAttribute('x', String(x))
        degree.setAttribute('y', '177')
        degree.setAttribute('text-anchor', 'middle')
        degree.setAttribute('fill', toneColor(tone.label))
        degree.setAttribute('font-family', "Georgia, 'Times New Roman', serif")
        degree.setAttribute('font-size', '18')
        degree.textContent = displayDegree(tone.label)
        const name = document.createElementNS(svg.namespaceURI, 'text')
        name.setAttribute('x', String(x))
        name.setAttribute('y', '199')
        name.setAttribute('text-anchor', 'middle')
        name.setAttribute('fill', '#656961')
        name.setAttribute('font-family', 'system-ui, sans-serif')
        name.setAttribute('font-size', '12')
        name.textContent = displayNote(pitches[index].scientific)
        svg.append(degree, name)
      })
      setError(false)
    }

    const render = () => { void draw().catch(() => { if (!cancelled) setError(true) }) }
    const observer = new ResizeObserver(render)
    observer.observe(host)
    render()
    return () => { cancelled = true; observer.disconnect(); host.replaceChildren() }
  }, [pitches, scale])

  const description = pitches.map((pitch, index) => {
    const tone = scale.tones[index % scale.tones.length]
    return `${displayNote(pitch.scientific)}, degree ${displayDegree(tone.label)}`
  }).join('; ')

  return <div className="scale-staff-scroll" tabIndex={0} role="region" aria-label="Ascending scale staff, scroll horizontally on small screens">
    <div className="scale-staff-view" role="img" aria-label={`${displayNote(scale.name)}, ascending from tonic to tonic. ${description}.`}>
      <div ref={hostRef} />
      {error && <p role="alert">The scale staff could not render. Scale tones remain listed above.</p>}
    </div>
  </div>
}
