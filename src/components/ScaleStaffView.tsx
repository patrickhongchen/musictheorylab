import { useCallback, useRef } from 'react'
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow/bravura'
import type { ExplorerScale, Pitch } from '../music/types'
import { displayNote } from '../presentation/notes'
import { scaleToneRole, SCALE_TONE_STYLE } from '../presentation/scales'
import { SVG_BODY_FONT, SVG_DISPLAY_FONT, appendSvgText, prepareNotationSvg, useNotationRenderer, vexKey } from './notation'

export default function ScaleStaffView({ scale, pitches }: { scale: ExplorerScale; pitches: readonly Pitch[] }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const draw = useCallback((host: HTMLDivElement) => {
    const width = Math.max(620, host.clientWidth)
    const renderer = new Renderer(host, Renderer.Backends.SVG)
    renderer.resize(width, 220)
    const context = renderer.getContext()
    const stave = new Stave(12, 28, width - 24).addClef('treble')
    stave.setContext(context).draw()

    const notes = pitches.map((pitch, index) => {
      const note = new StaveNote({
        keys: [vexKey(pitch)],
        duration: 'q',
      })
      const tone = scale.tones[index % scale.tones.length]
      const color = SCALE_TONE_STYLE[scaleToneRole(tone.label)].color
      note.setKeyStyle(0, { fillStyle: color, strokeStyle: color })
      return note
    })
    const voice = new Voice({ numBeats: notes.length, beatValue: 4 }).addTickables(notes)
    Accidental.applyAccidentals([voice], 'C')
    new Formatter().joinVoices([voice]).formatToStave([voice], stave)
    voice.draw(context, stave)

    const svg = host.querySelector('svg')
    if (!svg) throw new Error('VexFlow did not produce an SVG staff')
    prepareNotationSvg(svg, width, 220)

    notes.forEach((note, index) => {
      const tone = scale.tones[index % scale.tones.length]
      const x = note.getNoteHeadBeginX() + 4
      appendSvgText(svg, x, 177, displayNote(tone.label), { color: SCALE_TONE_STYLE[scaleToneRole(tone.label)].color, family: SVG_DISPLAY_FONT, size: 18 })
      appendSvgText(svg, x, 199, displayNote(pitches[index].scientific), { color: '#656961', family: SVG_BODY_FONT, size: 12 })
    })
  }, [pitches, scale])
  const error = useNotationRenderer(hostRef, draw)

  const description = pitches.map((pitch, index) => {
    const tone = scale.tones[index % scale.tones.length]
    return `${displayNote(pitch.scientific)}, degree ${displayNote(tone.label)}`
  }).join('; ')

  return <div className="scale-staff-scroll" tabIndex={0} role="region" aria-label="Ascending scale staff, scroll horizontally on small screens">
    <div className="scale-staff-view" role="img" aria-label={`${displayNote(scale.name)}, ascending from tonic to tonic. ${description}.`}>
      <div ref={hostRef} />
      {error && <p role="alert">The scale staff could not render. Scale tones remain listed above.</p>}
    </div>
  </div>
}
