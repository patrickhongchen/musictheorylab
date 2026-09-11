import { lazy, Suspense, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { TheoryControls } from '../components/TheoryControls'
import { ProgressionStepSelector } from '../components/ProgressionStepSelector'
import { ProgressionPathView, PROGRESSION_STEP_COLORS } from '../components/ProgressionPathView'
import type { ProgressionLabelMode } from '../components/ProgressionPathView'
import { createProgressionVoicingFretboard } from '../music/fretboard'
import { createProgression, DEFAULT_PROGRESSION_DEGREES, harmonizationChoices } from '../music/progressions'
import { createScale } from '../music/scales'
import type { ProgressionChordDegrees, ScaleDegree } from '../music/types'
import { displayNote } from '../presentation/notes'

const ProgressionStaffView = lazy(() => import('../components/ProgressionStaffView'))
const PROGRESSION_FRET_COUNT = 22
const TOP_NOTE_STRING_OPTIONS = [
  { string: 1, label: 'High E' },
  { string: 2, label: 'B' },
  { string: 3, label: 'G' },
  { string: 4, label: 'D' },
] as const
type TopNoteString = typeof TOP_NOTE_STRING_OPTIONS[number]['string']

function closedTriadStrings(topNoteString: TopNoteString): readonly number[] {
  return [topNoteString, topNoteString + 1, topNoteString + 2]
}

function replaceDegree(degrees: ProgressionChordDegrees, index: number, degree: ScaleDegree): ProgressionChordDegrees {
  const next = [...degrees]
  next[index] = degree
  return next as unknown as ProgressionChordDegrees
}

export function ProgressionBuilder() {
  const [tonic, setTonic] = useState('C')
  const [selectedDegrees, setSelectedDegrees] = useState<ProgressionChordDegrees>(DEFAULT_PROGRESSION_DEGREES)
  const [activeStep, setActiveStep] = useState(0)
  const [topNoteString, setTopNoteString] = useState<TopNoteString>(1)
  const [progressionLabelMode, setProgressionLabelMode] = useState<ProgressionLabelMode>('key')
  const scale = useMemo(() => createScale({ tonic, mode: 'major' }), [tonic])
  const progression = useMemo(() => createProgression(scale, selectedDegrees), [scale, selectedDegrees])
  const choices = useMemo(() => scale.notes.map((_, index) => harmonizationChoices(scale, (index + 1) as ScaleDegree)), [scale])
  const voicingStrings = useMemo(() => closedTriadStrings(topNoteString), [topNoteString])
  const progressionBoard = useMemo(
    () => createProgressionVoicingFretboard(progression, voicingStrings, undefined, PROGRESSION_FRET_COUNT, true),
    [progression, voicingStrings],
  )
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
        <div className="progression-fretboard-title">
          <h2 id="progression-fretboard-heading">Across the progression</h2>
          <div className="path-legend" role="list" aria-label="Progression path symbols">
            <span role="listitem"><i className="path-legend-line" aria-hidden="true" />Selected inversion</span>
            <span role="listitem"><i className="path-legend-dot" aria-hidden="true" />Top note + step</span>
          </div>
        </div>
      </div>
      <div className="progression-toolbar" aria-label="Fretboard display controls">
        <fieldset className="label-mode-picker">
          <legend>Note labels</legend>
          <div>
            <label>
              <input type="radio" name="progression-label-mode" checked={progressionLabelMode === 'key'} onChange={() => setProgressionLabelMode('key')} />
              <span>In key</span>
            </label>
            <label>
              <input type="radio" name="progression-label-mode" checked={progressionLabelMode === 'chord'} onChange={() => setProgressionLabelMode('chord')} />
              <span>In chord</span>
            </label>
          </div>
        </fieldset>
        <fieldset className="top-note-string-picker">
          <legend>Top note string</legend>
          <div>
            {TOP_NOTE_STRING_OPTIONS.map(option => <label key={option.string}>
              <input
                type="radio"
                name="top-note-string"
                checked={topNoteString === option.string}
                onChange={() => setTopNoteString(option.string)}
              />
              <span>{option.label}</span>
            </label>)}
          </div>
        </fieldset>
      </div>
      <div className="progression-strip is-path" role="group" aria-label="Choose a progression step for the fretboard">
        {progression.steps.map(step => <button
          type="button"
          className={step.index === activeStep ? 'is-active' : ''}
          aria-pressed={step.index === activeStep}
          onClick={() => selectProgressionStep(step.index)}
          style={{ '--step-color': PROGRESSION_STEP_COLORS[step.index] } as CSSProperties}
          key={`${step.index}-${step.triad.id}`}
        >
          <span>{step.index + 1}</span>
          <strong>{step.triad.romanNumeral}</strong>
          <small>{displayNote(step.topNote.name)} over {displayNote(step.triad.root.name)}</small>
        </button>)}
      </div>
      <p className="progression-map-status" role="status">{progressionLabelMode === 'key'
        ? <>Inversions repeat across the neck. Step {activeStep + 1} is highlighted; numbers show {displayNote(tonic)} major degrees.</>
        : <>Step {activeStep + 1}, <strong>{displayNote(activeProgressionStep.triad.chordName)}</strong>, is selected. Its notes are labeled relative to the chord; the other shapes keep note names only.</>}</p>
      <ProgressionPathView
        model={progressionBoard}
        steps={progression.steps}
        selectedStep={activeProgressionStep}
        progressionName={`${displayNote(tonic)} major progression`}
        labelMode={progressionLabelMode}
      />
      <div className="fretboard-caption"><p>The progression repeats toward the nut and fret 22 · follow the numbered top notes</p><p>Standard tuning: E A D G B E</p></div>
    </section>
    <footer className="page-footer">Progression Builder<span>Shape a phrase. See every harmony.</span></footer>
  </>
}
