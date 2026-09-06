import { lazy, Suspense, useMemo, useState } from 'react'
import { TheoryControls } from '../components/TheoryControls'
import { ProgressionStepSelector } from '../components/ProgressionStepSelector'
import { FretboardView, RoleLegend } from '../components/FretboardView'
import { ProgressionPathView } from '../components/ProgressionPathView'
import { createProgressionFretboards, createScaleFretboard } from '../music/fretboard'
import { createProgression, DEFAULT_PROGRESSION_DEGREES, harmonizationChoices } from '../music/progressions'
import { createScale } from '../music/scales'
import type { ProgressionChordDegrees, ScaleDegree } from '../music/types'
import { displayNote } from '../presentation/notes'

const ProgressionStaffView = lazy(() => import('../components/ProgressionStaffView'))
type FretboardMode = 'chord' | 'progression'
const STRING_WINDOWS = [
  { start: 1, label: '1–3 High' },
  { start: 2, label: '2–4' },
  { start: 3, label: '3–5' },
  { start: 4, label: '4–6 Low' },
] as const

function replaceDegree(degrees: ProgressionChordDegrees, index: number, degree: ScaleDegree): ProgressionChordDegrees {
  const next = [...degrees]
  next[index] = degree
  return next as unknown as ProgressionChordDegrees
}

export function ProgressionBuilder() {
  const [tonic, setTonic] = useState('C')
  const [selectedDegrees, setSelectedDegrees] = useState<ProgressionChordDegrees>(DEFAULT_PROGRESSION_DEGREES)
  const [activeStep, setActiveStep] = useState(0)
  const [fretboardMode, setFretboardMode] = useState<FretboardMode>('chord')
  const [stringWindowStart, setStringWindowStart] = useState(1)
  const scale = useMemo(() => createScale({ tonic, mode: 'major' }), [tonic])
  const progression = useMemo(() => createProgression(scale, selectedDegrees), [scale, selectedDegrees])
  const choices = useMemo(() => scale.notes.map((_, index) => harmonizationChoices(scale, (index + 1) as ScaleDegree)), [scale])
  const frames = useMemo(() => createProgressionFretboards(progression), [progression])
  const progressionBoard = useMemo(() => createScaleFretboard(scale), [scale])
  const visibleStrings = useMemo(
    () => new Set([stringWindowStart, stringWindowStart + 1, stringWindowStart + 2]),
    [stringWindowStart],
  )
  const activeFrame = frames[activeStep]
  const activeProgressionStep = progression.steps[activeStep]

  function selectHarmony(index: number, degree: ScaleDegree) {
    setSelectedDegrees(current => replaceDegree(current, index, degree))
    setActiveStep(index)
  }

  function selectProgressionStep(index: number) {
    setActiveStep(index)
  }

  return <>
    <div className="intro progression-intro">
      <div><h1>Build a progression.</h1><p>Choose one harmony beneath each top note, then see the whole phrase.</p></div>
      <TheoryControls tonic={tonic} onKeyChange={setTonic} />
    </div>

    <section className="progression-builder" aria-labelledby="progression-builder-heading">
      <h2 id="progression-builder-heading">Top-note harmonizations</h2>
      <div className="progression-step-grid">
        {scale.notes.map((note, index) => <ProgressionStepSelector
          key={`${tonic}-${note.name}`}
          stepIndex={index}
          topNote={note}
          candidates={choices[index]}
          selectedDegree={selectedDegrees[index]}
          onSelect={degree => selectHarmony(index, degree)}
        />)}
      </div>
    </section>

    <section className="progression-staff-section" aria-labelledby="progression-staff-heading">
      <div className="section-heading progression-section-heading">
        <h2 id="progression-staff-heading">The complete progression</h2>
        <span>Seven ascending top notes · one harmony each</span>
      </div>
      <Suspense fallback={<div className="progression-staff-loading">Preparing the complete staff…</div>}>
        <ProgressionStaffView progression={progression} keySignature={tonic} />
      </Suspense>
    </section>

    <section className="progression-fretboard-section" aria-labelledby="progression-fretboard-heading">
      <div className="section-heading progression-section-heading">
        <div className="progression-fretboard-title"><h2 id="progression-fretboard-heading">Across the progression</h2><RoleLegend /></div>
        <div className="fretboard-mode-switch" role="radiogroup" aria-label="Fretboard view">
          <span>View</span>
          <label>
            <input type="radio" name="fretboard-view" checked={fretboardMode === 'chord'} onChange={() => setFretboardMode('chord')} />
            <span>Chord detail</span>
          </label>
          <label>
            <input type="radio" name="fretboard-view" checked={fretboardMode === 'progression'} onChange={() => setFretboardMode('progression')} />
            <span>Progression path</span>
          </label>
        </div>
      </div>
      <div className="progression-strip" role="group" aria-label="Choose a progression step for the fretboard">
        {progression.steps.map(step => <button
          type="button"
          className={step.index === activeStep ? 'is-active' : ''}
          aria-pressed={step.index === activeStep}
          onClick={() => selectProgressionStep(step.index)}
          key={`${step.index}-${step.triad.id}`}
        >
          <span>{step.index + 1}</span>
          <strong>{step.triad.romanNumeral}</strong>
          <small>{displayNote(step.topNote.name)} over {displayNote(step.triad.root.name)}</small>
        </button>)}
      </div>
      {fretboardMode === 'chord' ? <>
        <p className="active-step-summary" role="status">
          Step {activeStep + 1} of 7 · top note <strong>{displayNote(activeProgressionStep.topNote.name)}</strong> · {displayNote(activeProgressionStep.triad.chordName)} · {activeProgressionStep.voicing.inversion.name}
        </p>
        <FretboardView model={activeFrame.model} chordName={`${activeProgressionStep.triad.chordName}, progression step ${activeStep + 1}`} />
        <div className="fretboard-caption"><p>Chord tones for the selected progression step</p><p>Standard tuning: E A D G B E</p></div>
      </> : <>
        <div className="progression-map-controls">
          <p role="status">Step {activeStep + 1} is selected. Top note <strong>{displayNote(activeProgressionStep.topNote.name)}</strong> is the dark-ring anchor; chord tones light up around it. Small numbers are top-note scale degrees.</p>
          <fieldset className="string-window-picker">
            <legend>Three-string view</legend>
            <div>
              {STRING_WINDOWS.map(window => <label key={window.start}>
                <input
                  type="radio"
                  name="string-window"
                  checked={stringWindowStart === window.start}
                  onChange={() => setStringWindowStart(window.start)}
                />
                <span>{window.label}</span>
              </label>)}
            </div>
          </fieldset>
        </div>
        <ProgressionPathView
          model={progressionBoard}
          visibleStrings={visibleStrings}
          selectedStep={activeProgressionStep}
          progressionName={`${displayNote(tonic)} major progression`}
        />
        <div className="fretboard-caption"><p>All seven top-note degrees stay visible · selected chord tones light up</p><p>Standard tuning: E A D G B E</p></div>
      </>}
    </section>
    <footer className="page-footer">Progression Builder<span>Shape a phrase. See every harmony.</span></footer>
  </>
}
