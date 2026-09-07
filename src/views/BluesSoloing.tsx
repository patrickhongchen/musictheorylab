import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { BluesPlayer } from '../audio/bluesPlayer'
import { BluesFretboardView, type BluesLabelMode } from '../components/BluesFretboardView'
import {
  COMMON_BLUES_KEYS,
  ascendingBluesScalePitches,
  connectGuideTones,
  createBluesFretboard,
  createTwelveBarBlues,
} from '../music/blues'
import { displayNote } from '../presentation/notes'

const BluesStaffView = lazy(() => import('../components/BluesStaffView'))

export function BluesSoloing() {
  const [tonic, setTonic] = useState('A')
  const [tempo, setTempo] = useState(72)
  const [selectedBar, setSelectedBar] = useState(4)
  const [playingBar, setPlayingBar] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [labelMode, setLabelMode] = useState<BluesLabelMode>('notes')
  const [showNextChord, setShowNextChord] = useState(false)
  const player = useRef<BluesPlayer | null>(null)

  const progression = useMemo(() => createTwelveBarBlues(tonic), [tonic])
  const activeIndex = playingBar ?? selectedBar
  const activeBar = progression.bars[activeIndex]
  const nextChangeBar = [...progression.bars.slice(activeIndex + 1), ...progression.bars.slice(0, activeIndex + 1)]
    .find(bar => bar.chord.degree !== activeBar.chord.degree) ?? progression.bars[(activeIndex + 1) % progression.bars.length]
  const scaleStaffPitches = useMemo(() => ascendingBluesScalePitches(progression.scale), [progression])
  const currentBoard = useMemo(
    () => createBluesFretboard(progression, activeBar.chord),
    [activeBar.chord, progression],
  )
  const nextBoard = useMemo(
    () => createBluesFretboard(progression, nextChangeBar.chord),
    [nextChangeBar.chord, progression],
  )
  const sharedTones = activeBar.chord.tones.filter(tone => nextChangeBar.chord.tones.some(nextTone => nextTone.pitchClass.chroma === tone.pitchClass.chroma))
  const guideMoves = connectGuideTones(activeBar.chord, nextChangeBar.chord)

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
    try {
      await instance.play(
        progression,
        tempo,
        barIndex => setPlayingBar(barIndex),
        () => {
          setIsPlaying(false)
          setPlayingBar(null)
        },
      )
    } catch {
      setIsPlaying(false)
      setPlayingBar(null)
    }
  }

  const selectBar = (index: number) => {
    stopPlayback()
    setSelectedBar(index)
  }

  const changeKey = (nextTonic: string) => {
    stopPlayback()
    setTonic(nextTonic)
    setSelectedBar(4)
  }

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
          <span>The blues vocabulary in standard notation</span>
        </div>
        <Suspense fallback={<div className="blues-staff-loading">Preparing the blues notation…</div>}>
          <BluesStaffView
            key={tonic}
            scale={progression.scale}
            scalePitches={scaleStaffPitches}
          />
        </Suspense>
    </section>

    <section className="blues-fretboard-section" aria-labelledby="blues-fretboard-heading">
      <div className="section-heading blues-fretboard-heading">
        <div>
          <h2 id="blues-fretboard-heading">See it under your fingers</h2>
          <p>Visualize the movement from the current chord to the next change.</p>
        </div>
      </div>
      <div className="transition-toolbar">
        <div className="transition-chords" aria-label={`Current chord ${displayNote(activeBar.chord.name)}, next chord ${displayNote(nextChangeBar.chord.name)}`}>
          <span>{showNextChord ? 'Current → Next' : 'Current chord'}</span>
          <p><strong className="current-chord">{displayNote(activeBar.chord.name)}</strong>{showNextChord && <><i aria-hidden="true">→</i><strong className="next-chord">{displayNote(nextChangeBar.chord.name)}</strong></>}</p>
          <small>{showNextChord ? <>Next change · bar {nextChangeBar.index + 1}</> : <>Chord tones + {scaleName} scale</>}</small>
        </div>
        <div className="transition-controls">
          <span className="full-neck-label">Full neck · frets 0–22</span>
          <button className={`overlay-toggle${showNextChord ? ' is-active' : ''}`} type="button" aria-pressed={showNextChord} onClick={() => setShowNextChord(shown => !shown)}>
            <i aria-hidden="true" />
            <span><b>{showNextChord ? 'Next chord shown' : 'Show next chord'}</b><small>{showNextChord ? 'Hide movement overlay' : `${displayNote(nextChangeBar.chord.name)} targets + paths`}</small></span>
          </button>
          <fieldset className="label-mode-picker">
            <legend>Marker labels</legend>
            <div>
              <label><input type="radio" name="blues-labels" checked={labelMode === 'notes'} onChange={() => setLabelMode('notes')} /><span>Notes</span></label>
              <label><input type="radio" name="blues-labels" checked={labelMode === 'degrees'} onChange={() => setLabelMode('degrees')} /><span>Degrees</span></label>
            </div>
          </fieldset>
        </div>
      </div>
      <BluesFretboardView currentModel={currentBoard} nextModel={nextBoard} currentChord={activeBar.chord} nextChord={nextChangeBar.chord} labelMode={labelMode} showNextChord={showNextChord} />
      <div className="transition-legend">
        <span><i className="scale-context-dot" /><b>Home scale</b><small>{scaleName}</small></span>
        {showNextChord && <span><i className="shared-tone-dot" /><b>Shared tone</b><small>in both chords</small></span>}
        <span><i className="current-tone-dot" /><b>Current chord</b><small>{displayNote(activeBar.chord.name)}{showNextChord ? ' only' : ' tones'}</small></span>
        {showNextChord && <span><i className="next-tone-dot" /><b>Next target</b><small>{displayNote(nextChangeBar.chord.name)} destination</small></span>}
      </div>
      <div className="transition-insight">
        <i aria-hidden="true" />
        {showNextChord ? <p>
          <strong>{sharedTones.map(tone => displayNote(tone.pitchClass.name)).join(' and ')} {sharedTones.length === 1 ? 'is' : 'are'} in both chords.</strong>{' '}
          Hold {sharedTones.length === 1 ? 'it' : 'them'} when it fits; move {guideMoves.map(move => `${displayNote(move.from.pitchClass.name)}→${displayNote(move.to.pitchClass.name)}`).join(' or ')} to make {displayNote(nextChangeBar.chord.name)} arrive. Faint dots keep the {scaleName} scale in view.
        </p> : <p><strong>Start with {displayNote(activeBar.chord.name)}.</strong> Green notes outline the chord; faint dots keep the {scaleName} vocabulary nearby. Add the next-chord overlay when you are ready to connect them.</p>}
      </div>
    </section>

    <footer className="page-footer blues-footer">
      <span>Blues Soloing Lab</span>
      <span>Method informed by <a href="https://viva.pressbooks.pub/openmusictheory/chapter/blues-harmony/" target="_blank" rel="noreferrer">Open Music Theory</a> and <a href="https://online.berklee.edu/courses/basic-improvisation" target="_blank" rel="noreferrer">Berklee Online</a>.</span>
    </footer>
  </div>
}
