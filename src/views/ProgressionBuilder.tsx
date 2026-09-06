import { lazy, Suspense, useMemo, useState } from 'react'
import { TheoryControls } from '../components/TheoryControls'
import { ProgressionStepSelector } from '../components/ProgressionStepSelector'
import { FretboardView, RoleLegend } from '../components/FretboardView'
import { ProgressionFretboardView } from '../components/ProgressionFretboardView'
import { createProgressionFretboard, createProgressionFretboards } from '../music/fretboard'
import { createProgression, DEFAULT_PROGRESSION_DEGREES, harmonizationChoices } from '../music/progressions'
import { createScale } from '../music/scales'
import type { ProgressionChordDegrees, ScaleDegree } from '../music/types'
import { displayNote } from '../presentation/notes'

const ProgressionStaffView = lazy(() => import('../components/ProgressionStaffView'))
type FretboardMode = 'chord' | 'progression'
const STRING_NUMBERS = [6, 5, 4, 3, 2, 1] as const

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
  const [spotlightStep, setSpotlightStep] = useState<number | null>(null)
  const [visibleStrings, setVisibleStrings] = useState<ReadonlySet<number>>(() => new Set(STRING_NUMBERS))
  const scale = useMemo(() => createScale({ tonic, mode: 'major' }), [tonic])
  const progression = useMemo(() => createProgression(scale, selectedDegrees), [scale, selectedDegrees])
  const choices = useMemo(() => scale.notes.map((_, index) => harmonizationChoices(scale, (index + 1) as ScaleDegree)), [scale])
  const frames = useMemo(() => createProgressionFretboards(progression), [progression])
  const progressionBoard = useMemo(() => createProgressionFretboard(progression), [progression])
  const activeFrame = frames[activeStep]
  const activeProgressionStep = progression.steps[activeStep]

  function selectHarmony(index: number, degree: ScaleDegree) {
    setSelectedDegrees(current => replaceDegree(current, index, degree))
    setActiveStep(index)
    if (fretboardMode === 'progression') setSpotlightStep(index)
  }

  function selectProgressionStep(index: number) {
    if (fretboardMode === 'chord') setActiveStep(index)
    else setSpotlightStep(current => current === index ? null : index)
  }

  function toggleString(string: number) {
    setVisibleStrings(current => {
      const next = new Set(current)
      if (next.has(string)) next.delete(string)
      else next.add(string)
      return next
    })
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
        <div className="fretboard-mode-switch" role="group" aria-label="Fretboard view">
          <span>View</span>
          <button type="button" aria-pressed={fretboardMode === 'chord'} onClick={() => setFretboardMode('chord')}>Chord detail</button>
          <button type="button" aria-pressed={fretboardMode === 'progression'} onClick={() => setFretboardMode('progression')}>Progression map</button>
        </div>
      </div>
      <div className="progression-strip" role="group" aria-label={fretboardMode === 'chord' ? 'Choose a progression step for the fretboard' : 'Spotlight a progression step on the fretboard'}>
        {progression.steps.map(step => <button
          type="button"
          className={(fretboardMode === 'chord' ? step.index === activeStep : step.index === spotlightStep) ? 'is-active' : ''}
          aria-pressed={fretboardMode === 'chord' ? step.index === activeStep : step.index === spotlightStep}
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
          <p role="status">{spotlightStep === null ? 'Each marker shows where that pitch appears in steps 1–7.' : `Step ${spotlightStep + 1} is spotlighted; all progression steps remain visible.`}</p>
          <fieldset className="string-filters">
            <legend>Strings shown</legend>
            <div>
              {STRING_NUMBERS.map(string => {
                const tuningNote = progressionBoard.tuning[progressionBoard.tuning.length - string]
                const register = string === 6 ? 'Low ' : string === 1 ? 'High ' : ''
                return <label key={string}>
                  <input type="checkbox" checked={visibleStrings.has(string)} onChange={() => toggleString(string)} />
                  <span>{string} {register}{displayNote(tuningNote.name)}</span>
                </label>
              })}
              <button type="button" disabled={visibleStrings.size === STRING_NUMBERS.length} onClick={() => setVisibleStrings(new Set(STRING_NUMBERS))}>All strings</button>
            </div>
          </fieldset>
        </div>
        {visibleStrings.size === 0 && <p className="empty-string-filter" role="status">Choose at least one string to show its progression markers.</p>}
        <ProgressionFretboardView
          model={progressionBoard}
          visibleStrings={visibleStrings}
          spotlightStep={spotlightStep}
          progressionName={`${displayNote(tonic)} major progression`}
        />
        <div className="fretboard-caption"><p>Available chord tones across the progression · not playable chord shapes</p><p>Standard tuning: E A D G B E</p></div>
      </>}
    </section>
    <footer className="page-footer">Progression Builder<span>Shape a phrase. See every harmony.</span></footer>
  </>
}
