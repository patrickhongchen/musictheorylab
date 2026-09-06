import { useEffect, useRef, useState } from 'react'
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow/bravura'
import type { HarmonizedProgression } from '../music/types'
import { displayNote, ROLE_STYLE } from '../presentation/notes'

export default function ProgressionStaffView({ progression, keySignature }: { progression: HarmonizedProgression; keySignature: string }) {
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
      const width = Math.max(980, host.clientWidth)
      const renderer = new Renderer(host, Renderer.Backends.SVG)
      renderer.resize(width, 225)
      const context = renderer.getContext()
      const stave = new Stave(12, 28, width - 24).addClef('treble').addKeySignature(keySignature)
      stave.setContext(context).draw()
      const chords = progression.steps.map(step => {
        const chord = new StaveNote({
          keys: step.voicing.notes.map(({ pitch }) => `${pitch.letter.toLowerCase()}${pitch.accidental}/${pitch.octave}`),
          duration: 'w',
        })
        step.voicing.notes.forEach((note, index) => chord.setKeyStyle(index, {
          fillStyle: ROLE_STYLE[note.role].color,
          strokeStyle: ROLE_STYLE[note.role].color,
        }))
        return chord
      })
      const voice = new Voice({ numBeats: 28, beatValue: 4 }).addTickables(chords)
      Accidental.applyAccidentals([voice], keySignature)
      new Formatter().joinVoices([voice]).formatToStave([voice], stave)
      voice.draw(context, stave)

      const svg = host.querySelector('svg')!
      svg.setAttribute('viewBox', `0 0 ${width} 225`)
      svg.removeAttribute('width')
      svg.removeAttribute('height')
      svg.style.width = '100%'
      svg.style.height = 'auto'
      svg.setAttribute('aria-hidden', 'true')
      progression.steps.forEach((step, index) => {
        const x = chords[index].getNoteHeadBeginX() + 4
        const group = document.createElementNS(svg.namespaceURI, 'g')
        const numeral = document.createElementNS(svg.namespaceURI, 'text')
        numeral.setAttribute('x', String(x))
        numeral.setAttribute('y', '174')
        numeral.setAttribute('text-anchor', 'middle')
        numeral.setAttribute('fill', '#22685b')
        numeral.setAttribute('font-family', "Georgia, 'Times New Roman', serif")
        numeral.setAttribute('font-size', '18')
        numeral.textContent = step.triad.romanNumeral
        const name = document.createElementNS(svg.namespaceURI, 'text')
        name.setAttribute('x', String(x))
        name.setAttribute('y', '198')
        name.setAttribute('text-anchor', 'middle')
        name.setAttribute('fill', '#656961')
        name.setAttribute('font-family', 'system-ui, sans-serif')
        name.setAttribute('font-size', '12')
        name.textContent = displayNote(step.triad.chordName)
        group.append(numeral, name)
        svg.append(group)
      })
      setError(false)
    }

    const render = () => { void draw().catch(() => { if (!cancelled) setError(true) }) }
    const observer = new ResizeObserver(render)
    observer.observe(host)
    render()
    return () => { cancelled = true; observer.disconnect(); host.replaceChildren() }
  }, [progression, keySignature])

  const description = progression.steps.map(step => `${step.triad.romanNumeral}, ${displayNote(step.triad.chordName)}, ${step.voicing.notes.map(note => displayNote(note.pitch.scientific)).join('–')}`).join('; ')
  return <div className="progression-staff-scroll" tabIndex={0} role="region" aria-label="Complete progression staff, scroll horizontally on small screens">
    <div className="progression-staff-view" role="img" aria-label={`Seven ascending top-note harmonizations in ${displayNote(keySignature)} major. ${description}.`}>
      <div ref={hostRef} />
      {error && <p role="alert">The progression staff could not render. Chord names remain listed below.</p>}
    </div>
  </div>
}
