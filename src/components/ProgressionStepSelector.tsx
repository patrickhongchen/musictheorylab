import type { PitchClass, ScaleDegree, TriadResult } from '../music/types'
import { displayNote } from '../presentation/notes'

interface Props {
  readonly stepIndex: number
  readonly topNote: PitchClass
  readonly candidates: readonly TriadResult[]
  readonly selectedDegree: ScaleDegree
  readonly onSelect: (degree: ScaleDegree) => void
}

export function ProgressionStepSelector({ stepIndex, topNote, candidates, selectedDegree, onSelect }: Props) {
  return <fieldset className="progression-step">
    <legend className="sr-only">Choose a harmony for top note {displayNote(topNote.name)}, scale degree {stepIndex + 1}</legend>
    <div className="progression-step-heading" aria-hidden="true">
      <span className="progression-step-number">{stepIndex + 1}</span>
      <span className="progression-top-note">{displayNote(topNote.name)}</span>
    </div>
    <div className="progression-choices">
      {candidates.map(({ triad, voicing }) => {
        const selected = triad.scaleDegree === selectedDegree
        return <label className={`progression-choice ${selected ? 'is-selected' : ''}`} key={triad.id}>
          <input
            type="radio"
            name={`harmony-${stepIndex}`}
            checked={selected}
            onChange={() => onSelect(triad.scaleDegree)}
            aria-label={`${triad.romanNumeral}, ${displayNote(triad.chordName)}, ${voicing.inversion.name}`}
          />
          <span className="selection-dot" aria-hidden="true" />
          <span className="progression-choice-roman">{triad.romanNumeral}</span>
          <span className="progression-choice-name">{displayNote(triad.chordName)}</span>
          <span className="progression-choice-inversion">{voicing.inversion.name}</span>
        </label>
      })}
    </div>
  </fieldset>
}
