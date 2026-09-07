import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { BluesPlayer } from '../audio/bluesPlayer'
import { BluesFretboardView, type BluesLabelMode } from '../components/BluesFretboardView'
import {
  COMMON_BLUES_KEYS,
  ascendingBluesScalePitches,
  changePhrasePitches,
  connectGuideTones,
  createBluesFretboard,
  createTwelveBarBlues,
  nearestScaleApproach,
  type BluesChordToneRole,
} from '../music/blues'
import { displayNote } from '../presentation/notes'

const BluesStaffView = lazy(() => import('../components/BluesStaffView'))

type PracticeFocus = 'roots' | 'guides' | 'approach'

const PRACTICE_STEPS: readonly {
  focus: PracticeFocus
  title: string
  instruction: string
}[] = [
  { focus: 'roots', title: 'Roots on beat 1', instruction: 'Play the root of each chord on beat 1 for 3–5 minutes.' },
  { focus: 'guides', title: 'Guide tones', instruction: 'Target the 3rd and ♭7 of each chord. Listen for the pull.' },
  { focus: 'approach', title: 'Approach and resolve', instruction: 'Approach the target from a step away, then land on it.' },
]

const ROLE_NAME: Record<BluesChordToneRole, string> = {
  root: 'root',
  third: '3rd',
  fifth: '5th',
  seventh: '♭7',
}

function movementLabel(semitones: number) {
  if (semitones === 0) return 'common tone'
  const direction = semitones > 0 ? 'up' : 'down'
  const amount = Math.abs(semitones)
  return `${direction} ${amount === 1 ? 'a half step' : `${amount} semitones`}`
}

export function BluesSoloing() {
  const [tonic, setTonic] = useState('A')
  const [focus, setFocus] = useState<PracticeFocus>('guides')
  const [tempo, setTempo] = useState(72)
  const [selectedBar, setSelectedBar] = useState(4)
  const [playingBar, setPlayingBar] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [labelMode, setLabelMode] = useState<BluesLabelMode>('notes')
  const [practiceStatus, setPracticeStatus] = useState('Choose a practice step when you are ready to narrow the challenge.')
  const player = useRef<BluesPlayer | null>(null)

  const progression = useMemo(() => createTwelveBarBlues(tonic), [tonic])
  const activeIndex = playingBar ?? selectedBar
  const activeBar = progression.bars[activeIndex]
  const previousBar = progression.bars[activeIndex === 0 ? progression.bars.length - 1 : activeIndex - 1]
  const isChange = previousBar.chord.degree !== activeBar.chord.degree
  const connections = useMemo(
    () => connectGuideTones(previousBar.chord, activeBar.chord),
    [activeBar.chord, previousBar.chord],
  )
  const targetRole: BluesChordToneRole = focus === 'roots' ? 'root' : 'third'
  const target = activeBar.chord.tones.find(tone => tone.role === targetRole) ?? activeBar.chord.tones[0]
  const approach = nearestScaleApproach(progression.scale, target.pitchClass)
  const notationLead = focus === 'roots' ? previousBar.chord.root : approach.pitchClass
  const scaleStaffPitches = useMemo(() => ascendingBluesScalePitches(progression.scale), [progression])
  const changeStaffPitches = changePhrasePitches(notationLead, target.pitchClass)
  const board = useMemo(() => createBluesFretboard(progression, activeBar.chord), [activeBar.chord, progression])
  const changeIndices = progression.bars.filter(bar => bar.beginsChange).map(bar => bar.index)

  useEffect(() => {
    const instance = new BluesPlayer()
    player.current = instance
    return () => {
      instance.dispose()
      player.current = null
    }
  }, [])

  const stopPlayback = () => {
    player.current?.stop()
    setIsPlaying(false)
    setPlayingBar(null)
  }

  const handlePlay = async () => {
    if (isPlaying) {
      stopPlayback()
      return
    }
    const instance = player.current
    if (!instance) return
    setIsPlaying(true)
    setPracticeStatus('Listen for each new color. The active bar drives the target note and fretboard below.')
    try {
      await instance.play(
        progression,
        tempo,
        barIndex => setPlayingBar(barIndex),
        () => {
          setIsPlaying(false)
          setPlayingBar(null)
          setPracticeStatus('Chorus complete. Sing one target note, then play the form again.')
        },
      )
    } catch {
      setIsPlaying(false)
      setPlayingBar(null)
      setPracticeStatus('Audio could not start. You can still step through the form bar by bar.')
    }
  }

  const selectBar = (index: number) => {
    stopPlayback()
    setSelectedBar(index)
  }

  const moveChange = (direction: -1 | 1) => {
    const next = direction > 0
      ? changeIndices.find(index => index > activeIndex) ?? changeIndices[0]
      : [...changeIndices].reverse().find(index => index < activeIndex) ?? changeIndices[changeIndices.length - 1]
    selectBar(next)
  }

  const changeKey = (nextTonic: string) => {
    stopPlayback()
    setTonic(nextTonic)
    setSelectedBar(4)
    setPracticeStatus(`Now listen for the same I–IV–V relationships in ${displayNote(nextTonic)}.`)
  }

  const startPractice = (step: typeof PRACTICE_STEPS[number], index: number) => {
    stopPlayback()
    setFocus(step.focus)
    setSelectedBar(index === 2 ? 8 : 4)
    setPracticeStatus(`${step.title} selected. ${step.instruction}`)
  }

  const scaleNotes = progression.scale.tones.map(tone => displayNote(tone.pitchClass.name)).join('  ')
  const scaleName = `${displayNote(progression.tonic.name)} minor blues`

  return <div className="blues-page">
    <div className="intro blues-intro">
      <div>
        <h1>Make the changes sing.</h1>
        <p>Keep the blues vocabulary. Land on the note that tells you the chord changed.</p>
      </div>
      <div className="blues-page-controls">
        <label className="key-control blues-key-control">
          <span>Key</span>
          <select value={tonic} onChange={event => changeKey(event.target.value)}>
            {COMMON_BLUES_KEYS.map(key => <option value={key} key={key}>{displayNote(key)}</option>)}
          </select>
        </label>
        <label className="key-control blues-focus-control">
          <span>Focus</span>
          <select value={focus} onChange={event => setFocus(event.target.value as PracticeFocus)}>
            <option value="roots">Roots</option>
            <option value="guides">Guide tones</option>
            <option value="approach">Approach notes</option>
          </select>
        </label>
        <label className="key-control blues-tempo-control">
          <span>Tempo</span>
          <select value={tempo} onChange={event => setTempo(Number(event.target.value))}>
            {[60, 72, 88].map(value => <option value={value} key={value}>{value} bpm</option>)}
          </select>
        </label>
        <button className="primary-button blues-play-button" type="button" onClick={handlePlay} aria-pressed={isPlaying}>
          <span aria-hidden="true">{isPlaying ? '■' : '▶'}</span>{isPlaying ? 'Stop' : 'Play 12 bars'}
        </button>
      </div>
    </div>

    <section className="blues-form-section" aria-labelledby="blues-form-heading">
      <div className="section-heading blues-form-heading">
        <h2 id="blues-form-heading">The form</h2>
        <ul className="blues-chord-legend" aria-label="Blues chord colors">
          {progression.chords.map(chord => <li className={`degree-${chord.degree}`} key={chord.degree}><i />{displayNote(chord.name)} ({chord.romanNumeral})</li>)}
        </ul>
      </div>
      <div className="blues-bar-grid" aria-label={`12-bar blues in ${displayNote(tonic)}`}>
        {progression.bars.map(bar => {
          const active = bar.index === activeIndex
          return <button
            type="button"
            key={bar.index}
            className={`blues-bar degree-${bar.chord.degree}${active ? ' is-active' : ''}${playingBar === bar.index ? ' is-playing' : ''}`}
            onClick={() => selectBar(bar.index)}
            aria-pressed={active}
            aria-label={`Bar ${bar.index + 1}, ${displayNote(bar.chord.name)}${bar.beginsChange ? ', chord change' : ''}`}
          >
            <span>{bar.index + 1}</span>
            <strong>{displayNote(bar.chord.name)}</strong>
            {playingBar === bar.index && <i aria-hidden="true">▶</i>}
          </button>
        })}
      </div>
    </section>

    <section className="change-lesson" aria-labelledby="change-heading" aria-live="polite">
      <div className="change-name">
        <h2 id="change-heading">{isChange ? 'What changed?' : 'Hold the sound.'}</h2>
        <p className="change-chords">
          <span className={`degree-${previousBar.chord.degree}`}>{displayNote(previousBar.chord.name)}</span>
          <span aria-hidden="true">→</span>
          <span className={`degree-${activeBar.chord.degree}`}>{displayNote(activeBar.chord.name)}</span>
        </p>
      </div>
      <div className="base-scale-summary">
        <span>Home base</span>
        <strong>{scaleName}</strong>
        <p>{scaleNotes}</p>
      </div>
      <div className="target-summary">
        <span>{focus === 'approach' ? 'Approach and resolve' : 'Target note'}</span>
        <strong className={`target-${target.role}`}>
          {focus === 'approach' && <>{displayNote(approach.pitchClass.name)} <span aria-hidden="true">→</span> </>}
          Aim for <b>{displayNote(target.pitchClass.name)}</b>
        </strong>
        <p>{ROLE_NAME[target.role]} of {displayNote(activeBar.chord.name)}</p>
      </div>
      <div className="change-explanation">
        {isChange ? <>
          <p><strong>{displayNote(target.pitchClass.name)}</strong> belongs to {displayNote(activeBar.chord.name)}. Landing there makes bar {activeBar.index + 1} sound intentional, even while the blues scale connects the phrase.</p>
          {focus !== 'roots' && <p className="tension-advice">Let {displayNote(approach.pitchClass.name)} create the blues rub; resolve it to {displayNote(target.pitchClass.name)} on the strong beat.</p>}
          <ul aria-label="Smooth guide-tone paths">
            {connections.map(connection => <li key={`${connection.from.pitchClass.name}-${connection.to.pitchClass.name}`}>
              {displayNote(connection.from.pitchClass.name)} → {displayNote(connection.to.pitchClass.name)} <span>{movementLabel(connection.semitones)}</span>
            </li>)}
          </ul>
        </> : <p>Stay with {displayNote(activeBar.chord.name)} and shape a phrase. Repetition and space make the next chord change easier to hear.</p>}
      </div>
      <div className="change-navigation">
        <button className="secondary-button" type="button" onClick={() => moveChange(-1)}>← Prev change</button>
        <button className="secondary-button" type="button" onClick={() => moveChange(1)}>Next change →</button>
      </div>
    </section>

    <section className="blues-target-section" aria-labelledby="targets-heading">
      <div className="section-heading">
        <h2 id="targets-heading">One home base, three targets</h2>
        <span>3rds name the chord · ♭7ths carry the dominant pull</span>
      </div>
      <div className="target-columns">
        {progression.chords.map(chord => <article className={chord.degree === activeBar.chord.degree ? 'is-active' : ''} key={chord.degree}>
          <h3 className={`degree-${chord.degree}`}>{displayNote(chord.name)} <small>({chord.romanNumeral})</small></h3>
          <span>Chord tones</span>
          <ol>
            {chord.tones.map(tone => <li className={`tone-${tone.role}`} key={tone.role}>
              <small>{displayNote(tone.label)}</small>
              <strong>{displayNote(tone.pitchClass.name)}</strong>
            </li>)}
          </ol>
        </article>)}
      </div>
      <div className="guide-legend">
        <span><i className="third-dot" />3rd = target tone that names the chord</span>
        <span><i className="seventh-dot" />♭7 = guide tone that wants to resolve</span>
      </div>
    </section>

    <section className="blues-staff-section" aria-labelledby="blues-staff-heading">
        <div className="section-heading">
          <h2 id="blues-staff-heading">Read it on the staff</h2>
          <span>The home vocabulary, then one clear arrival across the barline</span>
        </div>
        <Suspense fallback={<div className="blues-staff-loading">Preparing the blues notation…</div>}>
          <BluesStaffView
            key={`${tonic}-${activeIndex}-${focus}`}
            scale={progression.scale}
            scalePitches={scaleStaffPitches}
            changePitches={changeStaffPitches}
            fromChord={previousBar.chord}
            toChord={activeBar.chord}
            targetRole={targetRole}
            leadLabel={focus === 'roots' ? 'previous root' : focus === 'approach' ? 'approach' : 'guide tone'}
          />
        </Suspense>
    </section>

    <section className="blues-fretboard-section" aria-labelledby="blues-fretboard-heading">
      <div className="section-heading blues-fretboard-heading">
        <div>
          <h2 id="blues-fretboard-heading">See it under your fingers</h2>
          <p>Home scale stays visible. {displayNote(activeBar.chord.name)} chord tones come forward.</p>
        </div>
        <div className="blues-fretboard-controls">
          <fieldset className="label-mode-picker">
            <legend>Marker labels</legend>
            <div>
              <label><input type="radio" name="blues-labels" checked={labelMode === 'notes'} onChange={() => setLabelMode('notes')} /><span>Notes</span></label>
              <label><input type="radio" name="blues-labels" checked={labelMode === 'degrees'} onChange={() => setLabelMode('degrees')} /><span>Degrees</span></label>
            </div>
          </fieldset>
        </div>
      </div>
      <BluesFretboardView model={board} chord={activeBar.chord} labelMode={labelMode} />
      <div className="blues-map-legend">
        <span><i className="home-dot" />{scaleName} home base</span>
        <span><i className="third-dot" />3rd of {displayNote(activeBar.chord.name)}</span>
        <span><i className="seventh-dot" />♭7 of {displayNote(activeBar.chord.name)}</span>
        <span><i className="chord-dot" />Other chord tone</span>
      </div>
      <div className="fretboard-caption">
        <p>Open strings through fret 22 · scroll to explore the whole neck</p>
        <p>Standard tuning: E A D G B E</p>
      </div>
    </section>

    <section className="practice-section" aria-labelledby="practice-heading">
      <div className="section-heading">
        <h2 id="practice-heading">Your practice path</h2>
        <span id="practice-status" role="status">{practiceStatus}</span>
      </div>
      <ol className="practice-steps">
        {PRACTICE_STEPS.map((step, index) => <li className={focus === step.focus ? 'is-active' : ''} key={step.focus}>
          <span>{index + 1}</span>
          <div><h3>{step.title}</h3><p>{step.instruction}</p></div>
          <button className="secondary-button" type="button" onClick={() => startPractice(step, index)} aria-describedby="practice-status">Start</button>
        </li>)}
      </ol>
      <p className="practice-tip"><strong>Tip:</strong> Slow it down. Make one change at a time. Let your ear decide.</p>
    </section>

    <footer className="page-footer blues-footer">
      <span>Blues Soloing Lab</span>
      <span>Method informed by <a href="https://viva.pressbooks.pub/openmusictheory/chapter/blues-harmony/" target="_blank" rel="noreferrer">Open Music Theory</a> and <a href="https://online.berklee.edu/courses/basic-improvisation" target="_blank" rel="noreferrer">Berklee Online</a>.</span>
    </footer>
  </div>
}
