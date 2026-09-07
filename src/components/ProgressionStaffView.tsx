import { useCallback, useRef } from 'react'
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow/bravura'
import type { HarmonizedProgression } from '../music/types'
import { displayNote, ROLE_STYLE } from '../presentation/notes'
import { SVG_BODY_FONT, SVG_DISPLAY_FONT, appendSvgText, prepareNotationSvg, useNotationRenderer, vexKey } from './notation'

export default function ProgressionStaffView({ progression, keySignature }: { progression: HarmonizedProgression; keySignature: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const draw = useCallback((host: HTMLDivElement) => {
    const width = Math.max(980, host.clientWidth)
    const renderer = new Renderer(host, Renderer.Backends.SVG)
    renderer.resize(width, 225)
    const context = renderer.getContext()
    const stave = new Stave(12, 28, width - 24).addClef('treble').addKeySignature(keySignature)
    stave.setContext(context).draw()
    const chords = progression.steps.map(step => {
      const chord = new StaveNote({
        keys: step.voicing.notes.map(({ pitch }) => vexKey(pitch)),
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

    const svg = host.querySelector('svg')
    if (!svg) throw new Error('VexFlow did not produce an SVG staff')
    prepareNotationSvg(svg, width, 225)
    progression.steps.forEach((step, index) => {
      const x = chords[index].getNoteHeadBeginX() + 4
      appendSvgText(svg, x, 174, step.triad.romanNumeral, { color: '#22685b', family: SVG_DISPLAY_FONT, size: 18 })
      appendSvgText(svg, x, 198, displayNote(step.triad.chordName), { color: '#656961', family: SVG_BODY_FONT, size: 12 })
    })
  }, [keySignature, progression])
  const error = useNotationRenderer(hostRef, draw)

  const description = progression.steps.map(step => `${step.triad.romanNumeral}, ${displayNote(step.triad.chordName)}, ${step.voicing.notes.map(note => displayNote(note.pitch.scientific)).join('–')}`).join('; ')
  return <div className="progression-staff-scroll" tabIndex={0} role="region" aria-label="Complete progression staff, scroll horizontally on small screens">
    <div className="progression-staff-view" role="img" aria-label={`Seven ascending top-note harmonizations in ${displayNote(keySignature)} major. ${description}.`}>
      <div ref={hostRef} />
      {error && <p role="alert">The progression staff could not render. Chord names remain listed below.</p>}
    </div>
  </div>
}
