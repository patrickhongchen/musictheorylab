import { lazy, Suspense, useMemo, useState } from 'react'
import { createScale } from '../music/scales'
import { diatonicTriads } from '../music/triads'
import { harmonizeTopNote } from '../music/voicings'
import { createFretboard } from '../music/fretboard'
import { TheoryControls } from '../components/TheoryControls'
import { NoteSelector } from '../components/NoteSelector'
import { ChordOptionCard } from '../components/ChordOptionCard'
import { FretboardView, RoleLegend } from '../components/FretboardView'
import { ToneNotes } from '../components/ToneNotes'
import { displayNote, ROLE_STYLE } from '../presentation/notes'

const StaffView = lazy(() => import('../components/StaffView'))
const AudioControls = lazy(() => import('../components/AudioControls'))

export function TriadExplorer() {
  const [tonic, setTonic] = useState('C')
  const [topIndex, setTopIndex] = useState(4)
  const [chordDegree, setChordDegree] = useState(1)
  const scale = useMemo(() => createScale({ tonic, mode: 'major' }), [tonic])
  const triads = useMemo(() => diatonicTriads(scale), [scale])
  const topNote = scale.notes[topIndex]
  const candidates = useMemo(() => harmonizeTopNote(triads, topNote.name), [triads, topNote.name])
  const active = candidates.find(result => result.triad.scaleDegree === chordDegree) ?? candidates[0]
  const board = useMemo(() => createFretboard(active.triad.tones), [active.triad])
  const { triad, voicing } = active
  const selectionId = `${triad.id}:${voicing.soprano.pitch.scientific}`

  function selectTop(index: number) {
    setTopIndex(index)
    setChordDegree(1)
  }

  return <>
      <div className="intro">
        <div><h1>One note. Three harmonies.</h1><p>Keep a note on top. Discover the chords beneath it.</p></div>
        <TheoryControls tonic={tonic} onKeyChange={setTonic} />
      </div>

      <NoteSelector notes={scale.notes} selectedIndex={topIndex} onSelect={selectTop} />

      <section className="harmonizations" aria-labelledby="harmonizations-heading">
        <div className="section-heading"><h2 id="harmonizations-heading">Possible harmonizations</h2><span>{candidates.length} chords contain <strong>{displayNote(topNote.name)}</strong></span></div>
        <fieldset className="chord-options"><legend className="sr-only">Choose a harmonizing chord</legend>
          {candidates.map(result => <ChordOptionCard key={result.triad.id} result={result} selected={result.triad.id === triad.id} onSelect={() => setChordDegree(result.triad.scaleDegree)} />)}
        </fieldset>
        <span className="sr-only" role="status">{displayNote(triad.chordName)}, {triad.romanNumeral}. {voicing.inversion.name}. Bass {displayNote(voicing.bass.pitch.scientific)}; top note {displayNote(voicing.soprano.pitch.scientific)}.</span>
      </section>

      <section className="voicing-section" aria-label="Selected chord voicing">
        <div className="staff-panel">
          <h2>On the staff</h2>
          <Suspense fallback={<div className="staff-loading">Preparing the staff…</div>}><StaffView voicing={voicing} keySignature={tonic} /></Suspense>
          <div className="bass-to-top"><span>Bass to top</span><ToneNotes notes={voicing.notes} octaves /></div>
          <Suspense fallback={<p className="audio-hint">Preparing audio…</p>}><AudioControls key={selectionId} voicing={voicing} /></Suspense>
        </div>
        <div className="explanation">
          <div className="explanation-title"><h2>{voicing.inversion.name}</h2><span className="figure" aria-label={`${triad.romanNumeral}${voicing.inversion.figure ? ` ${voicing.inversion.figure}` : ''}`}>{triad.romanNumeral}<sup>{voicing.inversion.figure}</sup></span></div>
          <p><strong className={`role-${voicing.soprano.role}`}>{displayNote(topNote.name)}</strong> is the <strong>{ROLE_STYLE[voicing.soprano.role].label.toLowerCase()}</strong> of {displayNote(triad.chordName)}. With <strong>{displayNote(voicing.bass.pitch.name)}</strong> in the bass, this voicing is in <strong>{voicing.inversion.name.toLowerCase()}</strong>.</p>
          <dl className="voicing-facts">
            <div><dt>Root</dt><dd className="role-root">{displayNote(triad.root.name)}</dd></div>
            <div><dt>Bass</dt><dd className={`role-${voicing.bass.role}`}>{displayNote(voicing.bass.pitch.scientific)}</dd></div>
            <div><dt>Soprano</dt><dd className={`role-${voicing.soprano.role}`}>{displayNote(voicing.soprano.pitch.scientific)}</dd></div>
          </dl>
          <p className="learning-note">The bass determines the inversion. The top note stays the same.</p>
        </div>
      </section>

      <section className="fretboard-section" aria-labelledby="fretboard-heading">
        <div className="section-heading fretboard-heading"><h2 id="fretboard-heading">Across the fretboard</h2><RoleLegend /></div>
        <FretboardView model={board} chordName={triad.chordName} />
        <div className="fretboard-caption"><p>Available chord tones · not a single guitar voicing</p><p>Standard tuning: E A D G B E</p></div>
      </section>
      <footer className="page-footer">Diatonic Triad Explorer<span>Explore a note. Hear a possibility.</span></footer>
  </>
}
