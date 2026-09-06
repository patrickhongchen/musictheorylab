import { diatonicTriads } from './triads'
import { ascendingScaleSopranos, closePosition, harmonizeTopPitch } from './voicings'
import type { ChordToneRole, HarmonizedProgression, Pitch, ProgressionChordDegrees, Scale, ScaleDegree, TriadResult } from './types'

export const DEFAULT_PROGRESSION_DEGREES: ProgressionChordDegrees = [1, 2, 3, 4, 5, 6, 7]
const TOP_NOTE_ROLE_ORDER: Record<ChordToneRole, number> = { root: 0, fifth: 1, third: 2 }

export function harmonizationChoices(scale: Scale, topDegree: ScaleDegree, soprano?: Pitch): readonly TriadResult[] {
  const triads = diatonicTriads(scale)
  const top = soprano ?? ascendingScaleSopranos(scale)[topDegree - 1]
  return [...harmonizeTopPitch(triads, top)].sort((left, right) => {
    const leftRole = left.triad.tones.find(tone => tone.pitchClass.chroma === top.chroma)?.role
    const rightRole = right.triad.tones.find(tone => tone.pitchClass.chroma === top.chroma)?.role
    return TOP_NOTE_ROLE_ORDER[leftRole ?? 'third'] - TOP_NOTE_ROLE_ORDER[rightRole ?? 'third']
  })
}

export function createProgression(scale: Scale, chordDegrees: ProgressionChordDegrees): HarmonizedProgression {
  const triads = diatonicTriads(scale)
  const sopranos = ascendingScaleSopranos(scale)
  const steps = scale.notes.map((topNote, index) => {
    const topDegree = (index + 1) as ScaleDegree
    const chordDegree = chordDegrees[index]
    const triad = triads.find(candidate => candidate.scaleDegree === chordDegree)
    if (!triad || !triad.tones.some(tone => tone.pitchClass.chroma === topNote.chroma)) {
      throw new Error(`Scale degree ${chordDegree} cannot harmonize scale degree ${topDegree} (${topNote.name})`)
    }
    return { index, topDegree, topNote, triad, voicing: closePosition(triad, sopranos[index]) }
  })
  return { scale, steps }
}
