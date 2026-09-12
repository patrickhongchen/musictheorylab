import { lazy, Suspense, useMemo, useState, type CSSProperties } from 'react'
import { ScaleFretboardView, type ScaleFretboardLabelMode } from '../components/ScaleFretboardView'
import { CAGED_FORMS, createCagedPositions, type CagedForm } from '../music/caged'
import { createScaleToneFretboard } from '../music/fretboard'
import {
  createExplorerScale,
  MAJOR_KEYS,
  SCALE_EXPLORER_SCALE_LABELS,
  SCALE_EXPLORER_SCALE_TYPES,
} from '../music/scales'
import type { ScaleExplorerScaleType } from '../music/types'
import { ascendingScalePitches } from '../music/voicings'
import { displayNote } from '../presentation/notes'
import { scaleToneRole, SCALE_TONE_STYLE } from '../presentation/scales'

const ScaleStaffView = lazy(() => import('../components/ScaleStaffView'))
type CagedSelection = 'all' | CagedForm

export function ScaleExplorer() {
  const [tonic, setTonic] = useState('C')
  const [scaleType, setScaleType] = useState<ScaleExplorerScaleType>('majorPentatonic')
  const [labelMode, setLabelMode] = useState<ScaleFretboardLabelMode>('notes')
  const [cagedSelection, setCagedSelection] = useState<CagedSelection>('all')
  const scale = useMemo(() => createExplorerScale(tonic, scaleType), [tonic, scaleType])
  const scalePitches = useMemo(() => ascendingScalePitches(scale), [scale])
  const board = useMemo(() => createScaleToneFretboard(scale, undefined, 22), [scale])
  const cagedPositions = useMemo(() => (
    createCagedPositions(tonic, scale.tonicChordQuality, 22)
  ), [scale.tonicChordQuality, tonic])
  const scaleSummary = `${displayNote(scale.tonic)} ${scale.displayName.toLowerCase()} · ${scale.tones.length === 5 ? 'five' : 'seven'} notes`

  return <>
    <div className="intro scale-intro">
      <div>
        <h1>See the scale. Find the pattern.</h1>
        <p>Trace a scale across the neck and see how it overlaps the CAGED system.</p>
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
            {SCALE_EXPLORER_SCALE_TYPES.map(type => <label key={type}>
              <input
                type="radio"
                name="scale-type"
                checked={scaleType === type}
                onChange={() => setScaleType(type)}
              />
              <span>{SCALE_EXPLORER_SCALE_LABELS[type]}</span>
            </label>)}
          </div>
        </fieldset>
      </div>
    </div>

    <section className="scale-tone-section" aria-labelledby="scale-tone-heading">
      <div className="section-heading progression-section-heading">
        <h2 id="scale-tone-heading">Scale tones</h2>
        <span>{scaleSummary}</span>
      </div>
      <ol
        className="scale-tone-strip"
        style={{ '--scale-tone-count': scale.tones.length } as CSSProperties}
      >
        {scale.tones.map(tone => {
          const role = scaleToneRole(tone.label)
          return <li className={`scale-tone scale-tone-${role}`} key={tone.pitchClass.name}>
            <span className="scale-tone-degree">{displayNote(tone.label)}</span>
            <strong>{displayNote(tone.pitchClass.name)}</strong>
            <small>{SCALE_TONE_STYLE[role].label}</small>
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
        <fieldset className="caged-position-picker">
          <legend>CAGED positions</legend>
          <div>
            {(['all', ...CAGED_FORMS] as const).map(form => <label key={form}>
              <input
                type="radio"
                name="caged-position"
                checked={cagedSelection === form}
                onChange={() => setCagedSelection(form)}
              />
              <span>{form === 'all' ? 'All' : form}</span>
            </label>)}
          </div>
        </fieldset>
        <div className="scale-map-copy">
          <p className="scale-map-status" role="status">
            {cagedSelection === 'all'
              ? 'Full-neck scale map · all five CAGED positions shown'
              : `${cagedSelection} shape · tones inside this position are emphasized`}
          </p>
          <p className="caged-explanation">CAGED positions show five overlapping areas of the neck built around movable chord shapes.</p>
        </div>
      </div>
      <ScaleFretboardView
        model={board}
        scaleName={scale.name}
        labelMode={labelMode}
        cagedPositions={cagedPositions}
        activeCagedForm={cagedSelection}
      />
      <div className="fretboard-caption">
        <p>Scale tones repeat toward the nut and fret 22</p>
        <p>Standard tuning: E A D G B E</p>
      </div>
    </section>

    <footer className="page-footer">Scale Explorer<span>Choose a sound. See the whole neck.</span></footer>
  </>
}
