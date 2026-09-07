import { useEffect, useRef, useState } from 'react'
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow/bravura'
import { BluesMelodyPlayer } from '../audio/bluesMelodyPlayer'
import type { BluesScale } from '../music/blues'
import type { Pitch } from '../music/types'
import { displayNote } from '../presentation/notes'

const COLORS = { root: '#22685b', third: '#cc501c', fifth: '#72558e', color: '#656961', seventh: '#6e4e80' }

function scaleToneColor(label: string) {
  if (label === '1') return COLORS.root
  if (label === 'b3') return COLORS.third
  if (label === '5') return COLORS.fifth
  return COLORS.color
}

function vexKey(note: Pitch) {
  return `${note.letter.toLowerCase()}${note.accidental}/${note.octave}`
}

function prepareSvg(host: HTMLDivElement, width: number, height: number) {
  const svg = host.querySelector('svg')!
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  svg.removeAttribute('width')
  svg.removeAttribute('height')
  svg.style.width = '100%'
  svg.style.height = 'auto'
  svg.setAttribute('aria-hidden', 'true')
  return svg
}

function appendLabel(svg: SVGSVGElement, x: number, primary: string, secondary: string, color: string) {
  const degree = document.createElementNS(svg.namespaceURI, 'text')
  degree.setAttribute('x', String(x))
  degree.setAttribute('y', '174')
  degree.setAttribute('text-anchor', 'middle')
  degree.setAttribute('fill', color)
  degree.setAttribute('font-family', "Georgia, 'Times New Roman', serif")
  degree.setAttribute('font-size', '17')
  degree.textContent = primary
  const name = document.createElementNS(svg.namespaceURI, 'text')
  name.setAttribute('x', String(x))
  name.setAttribute('y', '197')
  name.setAttribute('text-anchor', 'middle')
  name.setAttribute('fill', '#656961')
  name.setAttribute('font-family', 'system-ui, sans-serif')
  name.setAttribute('font-size', '11')
  name.textContent = secondary
  svg.append(degree, name)
}

export default function BluesStaffView({
  scale,
  scalePitches,
}: {
  readonly scale: BluesScale
  readonly scalePitches: readonly Pitch[]
}) {
  const scaleHost = useRef<HTMLDivElement>(null)
  const player = useRef<BluesMelodyPlayer | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const instance = new BluesMelodyPlayer()
    player.current = instance
    return () => {
      instance.dispose()
      player.current = null
      clearTimeout(timer.current)
    }
  }, [])

  useEffect(() => {
    const scaleElement = scaleHost.current
    if (!scaleElement) return
    let cancelled = false
    scaleElement.replaceChildren()

    async function draw() {
      await document.fonts.ready
      if (cancelled || !scaleElement) return

      scaleElement.replaceChildren()
      const scaleWidth = Math.max(600, scaleElement.clientWidth)
      const scaleRenderer = new Renderer(scaleElement, Renderer.Backends.SVG)
      scaleRenderer.resize(scaleWidth, 210)
      const scaleContext = scaleRenderer.getContext()
      const scaleStave = new Stave(12, 28, scaleWidth - 24).addClef('treble')
      scaleStave.setContext(scaleContext).draw()
      const scaleNotes = scalePitches.map((note, index) => {
        const staveNote = new StaveNote({ keys: [vexKey(note)], duration: 'q' })
        const color = scaleToneColor(scale.tones[index % scale.tones.length].label)
        staveNote.setKeyStyle(0, { fillStyle: color, strokeStyle: color })
        return staveNote
      })
      const scaleVoice = new Voice({ numBeats: scaleNotes.length, beatValue: 4 }).addTickables(scaleNotes)
      Accidental.applyAccidentals([scaleVoice], 'C')
      new Formatter().joinVoices([scaleVoice]).formatToStave([scaleVoice], scaleStave)
      scaleVoice.draw(scaleContext, scaleStave)
      const scaleSvg = prepareSvg(scaleElement, scaleWidth, 210)
      scaleNotes.forEach((note, index) => {
        const tone = scale.tones[index % scale.tones.length]
        appendLabel(scaleSvg, note.getNoteHeadBeginX() + 4, displayNote(tone.label), displayNote(scalePitches[index].scientific), scaleToneColor(tone.label))
      })

      setError('')
    }

    void draw().catch(() => { if (!cancelled) setError('The staff could not render. The pitch labels remain available.') })
    return () => {
      cancelled = true
      scaleElement.replaceChildren()
    }
  }, [scale, scalePitches])

  async function play() {
    const instance = player.current
    if (!instance) return
    instance.stop()
    clearTimeout(timer.current)
    setPlaying(true)
    setError('')
    try {
      const duration = await instance.play(scalePitches, 0.34)
      if (player.current !== instance) return
      timer.current = setTimeout(() => setPlaying(false), duration)
    } catch {
      if (player.current !== instance) return
      setPlaying(false)
      setError('Audio could not start. Tap again and check your device volume.')
    }
  }

  const scaleDescription = scalePitches.map((note, index) => `${displayNote(note.scientific)}, degree ${displayNote(scale.tones[index % scale.tones.length].label)}`).join('; ')
  return <div className="blues-staff-grid">
    <article>
      <div className="blues-staff-title">
        <div><h3>Home scale</h3><p>{displayNote(scale.tones[0].pitchClass.name)} minor blues · ascending one octave</p></div>
        <button className="secondary-button" type="button" disabled={playing} onClick={() => void play()}>{playing ? 'Playing…' : '▶ Hear scale'}</button>
      </div>
      <div className="blues-staff-scroll" tabIndex={0} role="region" aria-label="Blues scale staff, scroll horizontally on small screens">
        <div className="blues-scale-staff" role="img" aria-label={scaleDescription}><div ref={scaleHost} /></div>
      </div>
    </article>
    {error && <p className="blues-staff-error" role="alert">{error}</p>}
  </div>
}
