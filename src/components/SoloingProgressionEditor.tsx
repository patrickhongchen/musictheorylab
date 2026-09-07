import { useState } from 'react'
import {
  NOTE_ROOTS,
  SOLOING_CHORD_QUALITIES,
  SOLOING_SCALE_TYPES,
  chordQualityLabel,
  createSoloingChord,
  createSoloingScale,
  createSoloingStepId,
  scaleTypeLabel,
  transposeSoloingProgression,
  type SoloingStep,
} from '../music/soloing'
import { displayNote } from '../presentation/notes'

interface Props {
  readonly progression: readonly SoloingStep[]
  readonly selectedStepId: string
  readonly onChange: (nextSteps: SoloingStep[], nextSelectedId: string) => void
}

function chordDisplay(step: SoloingStep) {
  return displayNote(createSoloingChord(step.chord.root, step.chord.quality).name)
}

function scaleDisplay(step: SoloingStep) {
  return displayNote(createSoloingScale(step.scale.root, step.scale.type).name)
}

function MoveArrow({ direction }: { readonly direction: 'left' | 'right' }) {
  const path = direction === 'left' ? 'M14 4 6 12l8 8' : 'm10 4 8 8-8 8'
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14">
    <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}

export function SoloingProgressionEditor({ progression, selectedStepId, onChange }: Props) {
  const [transposeAmount, setTransposeAmount] = useState(2)
  const selectedIndex = progression.findIndex(step => step.id === selectedStepId)
  const selectedStep = progression[selectedIndex] ?? progression[0]
  const effectiveSelectedIndex = selectedIndex >= 0 ? selectedIndex : 0

  const selectStep = (id: string) => {
    onChange([...progression], id)
  }

  const updateSelectedStep = (update: (step: SoloingStep) => SoloingStep) => {
    if (!selectedStep) return
    onChange(
      progression.map(step => step.id === selectedStep.id ? update(step) : step),
      selectedStep.id,
    )
  }

  const addStep = () => {
    const template = selectedStep
    const nextStep: SoloingStep = template
      ? {
          ...template,
          id: createSoloingStepId(),
          chord: { ...template.chord },
          scale: { ...template.scale },
        }
      : {
          id: createSoloingStepId(),
          chord: { root: NOTE_ROOTS[0], quality: SOLOING_CHORD_QUALITIES[0] },
          scale: { root: NOTE_ROOTS[0], type: SOLOING_SCALE_TYPES[0] },
        }
    const nextSteps = [...progression]
    nextSteps.splice(selectedStep ? effectiveSelectedIndex + 1 : 0, 0, nextStep)
    onChange(nextSteps, nextStep.id)
  }

  const moveSelectedStep = (offset: -1 | 1) => {
    const destination = effectiveSelectedIndex + offset
    if (!selectedStep || destination < 0 || destination >= progression.length) return
    const nextSteps = [...progression]
    nextSteps.splice(effectiveSelectedIndex, 1)
    nextSteps.splice(destination, 0, selectedStep)
    onChange(nextSteps, selectedStep.id)
  }

  const selectRelativeStep = (offset: -1 | 1) => {
    if (!selectedStep || progression.length < 2) return
    const destination = (effectiveSelectedIndex + offset + progression.length) % progression.length
    onChange([...progression], progression[destination].id)
  }

  const deleteSelectedStep = () => {
    if (!selectedStep || progression.length <= 1) return
    const nextSteps = progression.filter(step => step.id !== selectedStep.id)
    const nextSelection = nextSteps[Math.min(effectiveSelectedIndex, nextSteps.length - 1)]
    if (nextSelection) onChange(nextSteps, nextSelection.id)
  }

  return <section className="soloing-progression-editor" aria-labelledby="soloing-progression-heading">
    <div className="soloing-progression-heading">
      <div>
        <h2 id="soloing-progression-heading">Your progression</h2>
        <p>Choose a chord, then give it the scale you want to hear.</p>
      </div>
      <button className="soloing-add-step" type="button" onClick={addStep}
        title={selectedStep ? `Insert after step ${effectiveSelectedIndex + 1}` : 'Add the first chord'}>
        <span aria-hidden="true">+</span> Add chord
      </button>
    </div>

    <div className="soloing-transpose-controls">
      <label htmlFor="soloing-transpose-amount">Transpose all</label>
      <select id="soloing-transpose-amount" value={transposeAmount}
        onChange={event => setTransposeAmount(Number(event.target.value))}>
        {[
          'Half step (1 semitone)', 'Whole step (2 semitones)', 'Minor 3rd (3 semitones)',
          'Major 3rd (4 semitones)', 'Perfect 4th (5 semitones)', 'Tritone (6 semitones)',
          'Perfect 5th (7 semitones)', 'Minor 6th (8 semitones)', 'Major 6th (9 semitones)',
          'Minor 7th (10 semitones)', 'Major 7th (11 semitones)',
        ].map((label, index) => <option key={index + 1} value={index + 1}>{label}</option>)}
      </select>
      <button type="button" disabled={!selectedStep}
        onClick={() => onChange(transposeSoloingProgression(progression, -transposeAmount), selectedStepId)}>
        Down
      </button>
      <button type="button" disabled={!selectedStep}
        onClick={() => onChange(transposeSoloingProgression(progression, transposeAmount), selectedStepId)}>
        Up
      </button>
      <span>Shifts every chord and scale together.</span>
    </div>

    {progression.length > 0
      ? <ol className="soloing-step-list" aria-label="Soloing progression">
          {progression.map((step, index) => {
            const selected = step.id === selectedStep?.id
            return <li key={step.id}>
              <button
                className={`soloing-step-card${selected ? ' is-selected' : ''}`}
                type="button"
                onClick={() => selectStep(step.id)}
                aria-pressed={selected}
                aria-label={`Step ${index + 1}: ${chordDisplay(step)}, ${scaleDisplay(step)}`}
              >
                <span className="soloing-step-number" aria-hidden="true">{index + 1}</span>
                <span className="soloing-step-summary">
                  <strong>{chordDisplay(step)}</strong>
                  <small>{scaleDisplay(step)}</small>
                </span>
              </button>
            </li>
          })}
        </ol>
      : <p className="soloing-empty-progression">Add a chord to begin your progression.</p>}

    {selectedStep && <fieldset className="soloing-step-editor">
      <legend>Edit selected chord <small>Step {effectiveSelectedIndex + 1}</small></legend>
      <div className="soloing-step-fields">
        <label>
          <span>Chord root</span>
          <select
            value={selectedStep.chord.root}
            onChange={event => updateSelectedStep(step => ({
              ...step,
              chord: { ...step.chord, root: event.target.value as SoloingStep['chord']['root'] },
            }))}
          >
            {NOTE_ROOTS.map(root => <option value={root} key={root}>{displayNote(root)}</option>)}
          </select>
        </label>
        <label>
          <span>Chord quality</span>
          <select
            value={selectedStep.chord.quality}
            onChange={event => updateSelectedStep(step => ({
              ...step,
              chord: { ...step.chord, quality: event.target.value as SoloingStep['chord']['quality'] },
            }))}
          >
            {SOLOING_CHORD_QUALITIES.map(quality => <option value={quality} key={quality}>{chordQualityLabel(quality)}</option>)}
          </select>
        </label>
        <label>
          <span>Scale root</span>
          <select
            value={selectedStep.scale.root}
            onChange={event => updateSelectedStep(step => ({
              ...step,
              scale: { ...step.scale, root: event.target.value as SoloingStep['scale']['root'] },
            }))}
          >
            {NOTE_ROOTS.map(root => <option value={root} key={root}>{displayNote(root)}</option>)}
          </select>
        </label>
        <label>
          <span>Scale type</span>
          <select
            value={selectedStep.scale.type}
            onChange={event => updateSelectedStep(step => ({
              ...step,
              scale: { ...step.scale, type: event.target.value as SoloingStep['scale']['type'] },
            }))}
          >
            {SOLOING_SCALE_TYPES.map(type => <option value={type} key={type}>{scaleTypeLabel(type)}</option>)}
          </select>
        </label>
      </div>
      <div className="soloing-step-actions" aria-label={`Actions for step ${effectiveSelectedIndex + 1}`}>
        <button
          className="soloing-step-navigation"
          type="button"
          onClick={() => selectRelativeStep(-1)}
          disabled={progression.length < 2}
          aria-label={`Select previous chord from step ${effectiveSelectedIndex + 1}`}
        >
          <MoveArrow direction="left" /> Previous
        </button>
        <button
          className="soloing-step-navigation"
          type="button"
          onClick={() => selectRelativeStep(1)}
          disabled={progression.length < 2}
          aria-label={`Select next chord from step ${effectiveSelectedIndex + 1}`}
        >
          Next <MoveArrow direction="right" />
        </button>
        <button type="button" onClick={addStep}>
          Duplicate
        </button>
        <button type="button" onClick={() => moveSelectedStep(-1)} disabled={effectiveSelectedIndex === 0}>
          <MoveArrow direction="left" /> Move earlier
        </button>
        <button type="button" onClick={() => moveSelectedStep(1)} disabled={effectiveSelectedIndex === progression.length - 1}>
          Move later <MoveArrow direction="right" />
        </button>
        <button
          className="soloing-delete-step"
          type="button"
          onClick={deleteSelectedStep}
          disabled={progression.length <= 1}
          aria-label={progression.length <= 1 ? 'Cannot delete the only progression step' : `Delete step ${effectiveSelectedIndex + 1}`}
        >
          Delete
        </button>
      </div>
      <p className="soloing-insertion-hint">New chords are inserted after the selected chord.</p>
    </fieldset>}
  </section>
}
