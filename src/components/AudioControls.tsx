import { useEffect, useRef, useState } from 'react'
import { VoicingPlayer } from '../audio/player'
import type { PlaybackMode } from '../audio/player'
import type { Voicing } from '../music/types'

export default function AudioControls({ voicing }: { voicing: Voicing }) {
  const player = useRef<VoicingPlayer | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [playing, setPlaying] = useState<PlaybackMode | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const instance = new VoicingPlayer()
    player.current = instance
    return () => { instance.dispose(); player.current = null; clearTimeout(timer.current) }
  }, [])

  async function play(mode: PlaybackMode) {
    const instance = player.current
    if (!instance) return
    setError('')
    setPlaying(mode)
    try {
      const duration = await instance.play(voicing, mode)
      if (player.current !== instance) return
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setPlaying(null), duration)
    } catch {
      if (player.current !== instance) return
      setPlaying(null)
      setError('Audio could not start. Tap again to retry, and check your device volume.')
    }
  }

  return <div className="audio-controls">
    <div className="audio-buttons">
      <button className="primary-button" disabled={playing !== null} onClick={() => void play('chord')}>
        <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M4 2 L14 8 L4 14 Z" fill="currentColor" /></svg>
        {playing === 'chord' ? 'Playing chord…' : 'Play chord'}
      </button>
      <button className="secondary-button" disabled={playing !== null} onClick={() => void play('arpeggio')}>{playing === 'arpeggio' ? 'Arpeggiating…' : 'Arpeggiate'}</button>
    </div>
    <p className="audio-hint" role="status">{error || (playing === 'chord' ? 'All three voices, together.' : playing === 'arpeggio' ? 'Listen from bass to top.' : 'Listen together, or from bass to top.')}</p>
  </div>
}
