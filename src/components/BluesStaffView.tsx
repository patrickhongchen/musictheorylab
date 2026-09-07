import { useEffect, useRef, useState } from 'react'
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow/bravura'
import { BluesMelodyPlayer } from '../audio/bluesMelodyPlayer'
import type { BluesChord, BluesChordToneRole, BluesScale } from '../music/blues'
import type { Pitch } from '../music/types'
import { displayNote } from '../presentation/notes'

const COLORS = { root: '#22685b', third: '#cc501c', fifth: '#72558e', color: '#656961', seventh: '#6e4e80' }

function scaleToneColor(label: string) {
  if (label === '1') return COLORS.root
  if (label === 'b3') return COLORS.third
  if (label === '5') return COLORS.fifth
  return COLORS.color
}

function targetColor(role: BluesChordToneRole) {
  if (role === 'third') return COLORS.third
  if (role === 'seventh') return COLORS.seventh
  if (role === 'fifth') return COLORS.fifth
  return COLORS.root
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
  changePitches,
  fromChord,
  toChord,
  targetRole,
  leadLabel,
}: {
  readonly scale: BluesScale
  readonly scalePitches: readonly Pitch[]
  readonly changePitches: readonly [Pitch, Pitch]
  readonly fromChord: BluesChord
  readonly toChord: BluesChord
  readonly targetRole: BluesChordToneRole
  readonly leadLabel: string
}) {
  const scaleHost = useRef<HTMLDivElement>(null)
  const changeHost = useRef<HTMLDivElement>(null)
  const player = useRef<BluesMelodyPlayer | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [playing, setPlaying] = useState<'scale' | 'change' | null>(null)
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
    const changeElement = changeHost.current
    if (!scaleElement || !changeElement) return
    let cancelled = false
    scaleElement.replaceChildren()
    changeElement.replaceChildren()

    async function draw() {
      await document.fonts.ready
      if (cancelled || !scaleElement || !changeElement) return

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

      changeElement.replaceChildren()
      const changeWidth = Math.max(500, changeElement.clientWidth)
      const changeRenderer = new Renderer(changeElement, Renderer.Backends.SVG)
      changeRenderer.resize(changeWidth, 210)
      const changeContext = changeRenderer.getContext()
      const firstWidth = Math.round(changeWidth * 0.48)
      const fromStave = new Stave(12, 28, firstWidth).addClef('treble').addTimeSignature('4/4')
      const toStave = new Stave(12 + firstWidth, 28, changeWidth - firstWidth - 24)
      fromStave.setContext(changeContext).draw()
      toStave.setContext(changeContext).draw()

      const lead = new StaveNote({ keys: [vexKey(changePitches[0])], duration: '8' })
      lead.setKeyStyle(0, { fillStyle: COLORS.root, strokeStyle: COLORS.root })
      const rests = [
        new StaveNote({ keys: ['b/4'], duration: 'hr' }),
        new StaveNote({ keys: ['b/4'], duration: 'qr' }),
        new StaveNote({ keys: ['b/4'], duration: '8r' }),
      ]
      const fromVoice = new Voice({ numBeats: 4, beatValue: 4 }).addTickables([...rests, lead])
      const target = new StaveNote({ keys: [vexKey(changePitches[1])], duration: 'w' })
      const color = targetColor(targetRole)
      target.setKeyStyle(0, { fillStyle: color, strokeStyle: color })
      const toVoice = new Voice({ numBeats: 4, beatValue: 4 }).addTickables([target])
      Accidental.applyAccidentals([fromVoice, toVoice], 'C')
      new Formatter().joinVoices([fromVoice]).formatToStave([fromVoice], fromStave)
      new Formatter().joinVoices([toVoice]).formatToStave([toVoice], toStave)
      fromVoice.draw(changeContext, fromStave)
      toVoice.draw(changeContext, toStave)
      const changeSvg = prepareSvg(changeElement, changeWidth, 210)
      appendLabel(changeSvg, lead.getNoteHeadBeginX() + 4, leadLabel, displayNote(changePitches[0].scientific), COLORS.root)
      appendLabel(changeSvg, target.getNoteHeadBeginX() + 4, 'target', displayNote(changePitches[1].scientific), color)
      setError('')
    }

    void draw().catch(() => { if (!cancelled) setError('The staff could not render. The pitch labels remain available.') })
    return () => {
      cancelled = true
      scaleElement.replaceChildren()
      changeElement.replaceChildren()
    }
  }, [changePitches, leadLabel, scale, scalePitches, targetRole])

  async function play(mode: 'scale' | 'change') {
    const instance = player.current
    if (!instance) return
    instance.stop()
    clearTimeout(timer.current)
    setPlaying(mode)
    setError('')
    try {
      const duration = await instance.play(mode === 'scale' ? scalePitches : changePitches, mode === 'scale' ? 0.34 : 0.62)
      if (player.current !== instance) return
      timer.current = setTimeout(() => setPlaying(null), duration)
    } catch {
      if (player.current !== instance) return
      setPlaying(null)
      setError('Audio could not start. Tap again and check your device volume.')
    }
  }

  const scaleDescription = scalePitches.map((note, index) => `${displayNote(note.scientific)}, degree ${displayNote(scale.tones[index % scale.tones.length].label)}`).join('; ')
  const changeDescription = `${displayNote(fromChord.name)} to ${displayNote(toChord.name)}: ${displayNote(changePitches[0].scientific)} approaches ${displayNote(changePitches[1].scientific)}, the ${targetRole} target.`

  return <div className="blues-staff-grid">
    <article>
      <div className="blues-staff-title">
        <div><h3>Home scale</h3><p>{displayNote(scale.tones[0].pitchClass.name)} minor blues · ascending one octave</p></div>
        <button className="secondary-button" type="button" disabled={playing !== null} onClick={() => void play('scale')}>{playing === 'scale' ? 'Playing…' : '▶ Hear scale'}</button>
      </div>
      <div className="blues-staff-scroll" tabIndex={0} role="region" aria-label="Blues scale staff, scroll horizontally on small screens">
        <div className="blues-scale-staff" role="img" aria-label={scaleDescription}><div ref={scaleHost} /></div>
      </div>
    </article>
    <article>
      <div className="blues-staff-title">
        <div><h3>Land the change</h3><p>{displayNote(fromChord.name)} → {displayNote(toChord.name)} · enter on the last eighth note</p></div>
        <button className="secondary-button" type="button" disabled={playing !== null} onClick={() => void play('change')}>{playing === 'change' ? 'Playing…' : '▶ Hear target'}</button>
      </div>
      <div className="blues-staff-scroll" tabIndex={0} role="region" aria-label="Chord-change phrase staff, scroll horizontally on small screens">
        <div className="blues-change-staff" role="img" aria-label={changeDescription}><div ref={changeHost} /></div>
      </div>
    </article>
    {error && <p className="blues-staff-error" role="alert">{error}</p>}
  </div>
}
