import { lazy, Suspense, useMemo, useState } from 'react'
import { ScaleFretboardView } from '../components/ScaleFretboardView'
import { createPentatonicScaleFretboard } from '../music/fretboard'
import { createPentatonicScale, MAJOR_KEYS } from '../music/scales'
import type { PentatonicScaleType } from '../music/types'
import { ascendingPentatonicPitches } from '../music/voicings'
import { displayNote } from '../presentation/notes'

type ScaleLabelMode = 'notes' | 'degrees'
const ScaleStaffView = lazy(() => import('../components/ScaleStaffView'))

function displayDegree(label: string) {
  return label.replace('b', '♭').replace('#', '♯')
}

function toneRole(label: string) {
  if (label === '1') return 'root'
  if (label === '3' || label === 'b3') return 'third'
  if (label === '5') return 'fifth'
  return 'color'
}

export function ScaleExplorer() {
  const [tonic, setTonic] = useState('C')
  const [scaleType, setScaleType] = useState<PentatonicScaleType>('major')
  const [labelMode, setLabelMode] = useState<ScaleLabelMode>('notes')
  const scale = useMemo(() => createPentatonicScale(tonic, scaleType), [tonic, scaleType])
  const scalePitches = useMemo(() => ascendingPentatonicPitches(scale), [scale])
  const board = useMemo(() => createPentatonicScaleFretboard(scale, undefined, 22), [scale])

  return <>
    <div className="intro scale-intro">
      <div>
        <h1>See the scale. Find the pattern.</h1>
        <p>Trace every tone of a pentatonic scale across the guitar neck.</p>
      </div>
      <div className="scale-page-controls">
        <label className="key-control scale-tonic-control">
          <span>Tonic</span>
          <select value={tonic} onChange={event => setTonic(event.target.value)}>
            {MAJOR_KEYS.map(key => <option key={key.tonic} value={key.tonic}>{displayNote(key.tonic)}</option>)}
          </select>
        </label>
        <fieldset className="scale-type-picker">
          <legend>Scale</legend>
          <div>
            {(['major', 'minor'] as const).map(type => <label key={type}>
              <input
                type="radio"
                name="pentatonic-type"
                checked={scaleType === type}
                onChange={() => setScaleType(type)}
              />
              <span>{type === 'major' ? 'Major pentatonic' : 'Minor pentatonic'}</span>
            </label>)}
          </div>
        </fieldset>
      </div>
    </div>

    <section className="scale-tone-section" aria-labelledby="scale-tone-heading">
      <div className="section-heading progression-section-heading">
        <h2 id="scale-tone-heading">Scale tones</h2>
        <span>{displayNote(scale.name)} · five notes</span>
      </div>
      <ol className="scale-tone-strip">
        {scale.tones.map(tone => {
          const role = toneRole(tone.label)
          return <li className={`scale-tone scale-tone-${role}`} key={tone.pitchClass.name}>
            <span className="scale-tone-degree">{displayDegree(tone.label)}</span>
            <strong>{displayNote(tone.pitchClass.name)}</strong>
            <small>{role === 'color' ? 'Scale tone' : role === 'root' ? 'Tonic' : `${role[0].toUpperCase()}${role.slice(1)}`}</small>
          </li>
        })}
      </ol>
    </section>

    <section className="scale-staff-section" aria-labelledby="scale-staff-heading">
      <div className="section-heading progression-section-heading">
        <h2 id="scale-staff-heading">On the staff</h2>
        <span>Ascending one octave · tonic to tonic</span>
      </div>
      <Suspense fallback={<div className="scale-staff-loading">Preparing the scale staff…</div>}>
        <ScaleStaffView scale={scale} pitches={scalePitches} />
      </Suspense>
    </section>

    <section className="scale-fretboard-section" aria-labelledby="scale-fretboard-heading">
      <div className="section-heading scale-fretboard-heading">
        <div>
          <h2 id="scale-fretboard-heading">Across the fretboard</h2>
          <ul className="scale-role-legend" aria-label="Scale-tone roles">
            <li className="scale-tone-root"><i aria-hidden="true" />Tonic</li>
            <li className="scale-tone-third"><i aria-hidden="true" />Third</li>
            <li className="scale-tone-fifth"><i aria-hidden="true" />Fifth</li>
            <li className="scale-tone-color"><i aria-hidden="true" />Other scale tones</li>
          </ul>
        </div>
      </div>
      <div className="progression-toolbar scale-toolbar" aria-label="Scale display controls">
        <fieldset className="label-mode-picker">
          <legend>Marker labels</legend>
          <div>
            <label>
              <input type="radio" name="scale-label-mode" checked={labelMode === 'notes'} onChange={() => setLabelMode('notes')} />
              <span>Notes</span>
            </label>
            <label>
              <input type="radio" name="scale-label-mode" checked={labelMode === 'degrees'} onChange={() => setLabelMode('degrees')} />
              <span>Degrees</span>
            </label>
          </div>
        </fieldset>
        <p className="scale-map-status" role="status">
          Chord tones are color-coded; the remaining notes complete the {scaleType} pentatonic sound.
        </p>
      </div>
      <ScaleFretboardView model={board} scaleName={scale.name} labelMode={labelMode} />
      <div className="fretboard-caption">
        <p>Scale tones repeat toward the nut and fret 22</p>
        <p>Standard tuning: E A D G B E</p>
      </div>
    </section>

    <footer className="page-footer">Pentatonic Scale Map<span>Choose a sound. See the whole neck.</span></footer>
  </>
}
