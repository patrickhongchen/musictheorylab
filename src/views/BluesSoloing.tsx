import { lazy, Suspense, useMemo, useState } from 'react'
import { SoloingFretboardView, SoloingVisualLegend, type SoloingLabelMode } from '../components/SoloingFretboardView'
import { SoloingProgressionEditor } from '../components/SoloingProgressionEditor'
import type { SoloingNoteFilter } from '../components/soloingVisualTypes'
import {
  createSeedSoloingProgression,
  createSoloingFretboard,
  createSoloingScale,
  createSoloingStaffModel,
  getNextSoloingStep,
  type SoloingStep,
} from '../music/soloing'
import { displayNote } from '../presentation/notes'

const SoloingStaffView = lazy(() => import('../components/SoloingStaffView'))

export function BluesSoloing() {
  const [progression, setProgression] = useState<SoloingStep[]>(createSeedSoloingProgression)
  const [selectedStepId, setSelectedStepId] = useState('seed-d7')
  const [showNextChord, setShowNextChord] = useState(false)
  const [labelMode, setLabelMode] = useState<SoloingLabelMode>('notes')
  const [noteFilter, setNoteFilter] = useState<SoloingNoteFilter>('both')

  const selectedIndex = Math.max(0, progression.findIndex(step => step.id === selectedStepId))
  const selectedStep = progression[selectedIndex] ?? progression[0]
  const nextStep = selectedStep ? getNextSoloingStep(progression, selectedStep.id) : undefined
  const staffModel = useMemo(
    () => selectedStep ? createSoloingStaffModel(selectedStep, nextStep) : undefined,
    [nextStep, selectedStep],
  )
  const fretboardModel = useMemo(
    () => selectedStep ? createSoloingFretboard(selectedStep, nextStep) : undefined,
    [nextStep, selectedStep],
  )
  const nextScale = useMemo(
    () => nextStep ? createSoloingScale(nextStep.scale.root, nextStep.scale.type) : undefined,
    [nextStep],
  )
  const nextStepNumber = nextStep ? (selectedIndex + 1) % progression.length + 1 : undefined
  const effectiveShowNextChord = showNextChord && noteFilter !== 'scale'

  function updateProgression(nextProgression: SoloingStep[], nextSelectedStepId: string) {
    setProgression(nextProgression)
    setSelectedStepId(nextSelectedStepId)
    if (nextProgression.length < 2) setShowNextChord(false)
  }

  return <div className="soloing-page">
    <div className="intro soloing-intro">
      <div>
        <h1>Solo over any progression.</h1>
        <p>Build the changes, choose a scale for each chord, and see both under your fingers.</p>
      </div>
    </div>

    <SoloingProgressionEditor
      progression={progression}
      selectedStepId={selectedStep?.id ?? selectedStepId}
      onChange={updateProgression}
    />

    {staffModel && fretboardModel && <section className="soloing-workbench" aria-labelledby="soloing-workbench-heading">
      <div className="soloing-workbench-heading">
        <h2 id="soloing-workbench-heading">Selected sound</h2>
        <div className="soloing-sound-summary" role="status" aria-live="polite">
          <span>Current</span>
          <strong>{displayNote(staffModel.currentChord.name)}</strong>
          <i aria-hidden="true">·</i>
          <b>{displayNote(staffModel.scale.name)}</b>
          {staffModel.nextChord && <>
            <em aria-hidden="true" />
            <span>Next</span>
            <strong>{displayNote(staffModel.nextChord.name)}</strong>
            <i aria-hidden="true">·</i>
            <b>{nextScale ? displayNote(nextScale.name) : ''}</b>
          </>}
        </div>
        <div className="soloing-workbench-controls">
          <div className="soloing-next-control">
            <span>Look ahead</span>
            <button
              className={`overlay-toggle${effectiveShowNextChord ? ' is-active' : ''}`}
              type="button"
              aria-label={noteFilter === 'scale'
                ? 'Next chord unavailable in Scale view'
                : `${showNextChord ? 'Hide' : 'Show'} next chord${nextStepNumber ? `, step ${nextStepNumber}` : ''}`}
              aria-pressed={effectiveShowNextChord}
              disabled={!nextStep || noteFilter === 'scale'}
              onClick={() => setShowNextChord(shown => !shown)}
            >
              <i aria-hidden="true" />
              <span>
                <b>Next chord</b>
                <small>{noteFilter === 'scale' ? 'Both or Chord' : nextStepNumber ? `Step ${nextStepNumber}` : 'Add a chord'}</small>
              </span>
            </button>
          </div>
          <fieldset className="label-mode-picker soloing-note-filter">
            <legend>Notes shown</legend>
            <div>
              <label><input type="radio" name="soloing-note-filter" checked={noteFilter === 'both'} onChange={() => setNoteFilter('both')} /><span>Both</span></label>
              <label><input type="radio" name="soloing-note-filter" checked={noteFilter === 'chord'} onChange={() => setNoteFilter('chord')} /><span>Chord</span></label>
              <label><input type="radio" name="soloing-note-filter" checked={noteFilter === 'scale'} onChange={() => setNoteFilter('scale')} /><span>Scale</span></label>
            </div>
          </fieldset>
          <fieldset className="label-mode-picker soloing-label-picker">
            <legend>Marker labels</legend>
            <div>
              <label><input type="radio" name="soloing-labels" checked={labelMode === 'notes'} onChange={() => setLabelMode('notes')} /><span>Notes</span></label>
              <label><input type="radio" name="soloing-labels" checked={labelMode === 'degrees'} onChange={() => setLabelMode('degrees')} /><span>Scale degrees</span></label>
            </div>
          </fieldset>
        </div>
      </div>

      <div className="soloing-legend-row">
        <SoloingVisualLegend showNextChord={effectiveShowNextChord} noteFilter={noteFilter} />
      </div>

      <section className="soloing-visual-section" aria-labelledby="soloing-staff-heading">
        <div className="soloing-visual-heading">
          <div>
            <h3 id="soloing-staff-heading">On the staff</h3>
            <p>{displayNote(staffModel.scale.name)} from tonic to tonic</p>
          </div>
          <span>{noteFilter === 'scale'
            ? 'Showing the selected scale without chord emphasis.'
            : noteFilter === 'chord'
              ? 'Showing chord tones only.'
              : 'Chord tones are emphasized in pitch order within the scale.'}</span>
        </div>
        <Suspense fallback={<div className="blues-staff-loading">Preparing the staff…</div>}>
          <SoloingStaffView model={staffModel} showNextChord={effectiveShowNextChord} noteFilter={noteFilter} />
        </Suspense>
      </section>

      <section className="soloing-visual-section soloing-fretboard-section" aria-labelledby="soloing-fretboard-heading">
        <div className="soloing-visual-heading">
          <div>
            <h3 id="soloing-fretboard-heading">Across the fretboard</h3>
            <p>Standard tuning · frets 0–22</p>
          </div>
          <span>Scroll the neck horizontally to explore every position.</span>
        </div>
        <SoloingFretboardView
          model={fretboardModel}
          scale={staffModel.scale}
          currentChord={staffModel.currentChord}
          nextChord={staffModel.nextChord}
          labelMode={labelMode}
          showNextChord={effectiveShowNextChord}
          noteFilter={noteFilter}
        />
      </section>
    </section>}

    <footer className="page-footer soloing-footer">
      <span>Soloing</span>
      <span>Build the harmony. Choose the color. Follow the change.</span>
    </footer>
  </div>
}
