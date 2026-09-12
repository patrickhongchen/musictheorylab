import { Note } from 'tonal'
import { CHORD_CATALOG, createChordTones, type ChordToneRole } from './chordCatalog'
import { SCALE_CATALOG, createScaleTones, type ScaleLabel } from './scaleCatalog'
import { STANDARD_TUNING } from './fretboard'
import { pitchAtMidi, pitchClass } from './pitches'
import type { Pitch, PitchClass } from './types'

export type BluesDegree = 1 | 4 | 5
export type BluesScaleDegree = ScaleLabel<'blues'>

export interface BluesChordTone {
  readonly pitchClass: PitchClass
  readonly role: ChordToneRole
  readonly label: typeof CHORD_CATALOG.dominant7.labels[number]
}

export interface BluesChord {
  readonly degree: BluesDegree
  readonly root: PitchClass
  readonly name: string
  readonly romanNumeral: 'I' | 'IV' | 'V'
  readonly tones: readonly BluesChordTone[]
}

export interface BluesScaleTone {
  readonly pitchClass: PitchClass
  readonly label: BluesScaleDegree
}

export interface BluesScale {
  readonly name: string
  readonly tones: readonly BluesScaleTone[]
}

export interface BluesBar {
  readonly index: number
  readonly phrase: 1 | 2 | 3
  readonly chord: BluesChord
  readonly beginsChange: boolean
}

export interface TwelveBarBlues {
  readonly tonic: PitchClass
  readonly scale: BluesScale
  readonly chords: readonly [BluesChord, BluesChord, BluesChord]
  readonly bars: readonly BluesBar[]
}

export interface GuideToneConnection {
  readonly from: BluesChordTone
  readonly to: BluesChordTone
  readonly semitones: number
}

export interface BluesFretPosition {
  readonly string: number
  readonly fret: number
  readonly pitchClass: PitchClass
  readonly scaleTone?: BluesScaleTone
  readonly chordTone?: BluesChordTone
}

export interface BluesFretboardModel {
  readonly tuning: readonly Pitch[]
  readonly fretStart: number
  readonly fretEnd: number
  readonly positions: readonly BluesFretPosition[]
}

const FORM: readonly BluesDegree[] = [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5]

function createDominantChord(rootName: string, degree: BluesDegree): BluesChord {
  const root = pitchClass(rootName)
  const numeral = degree === 1 ? 'I' : degree === 4 ? 'IV' : 'V'
  return {
    degree,
    root,
    name: `${root.name}${CHORD_CATALOG.dominant7.suffix}`,
    romanNumeral: numeral,
    tones: createChordTones(root, CHORD_CATALOG.dominant7),
  }
}

/** Builds the common turnaround form: I I I I / IV IV I I / V IV I V. */
export function createTwelveBarBlues(tonicName: string): TwelveBarBlues {
  const tonic = pitchClass(tonicName)
  const major = createScaleTones(tonic.name, SCALE_CATALOG.ionian)
  const blues = createScaleTones(tonic.name, SCALE_CATALOG.blues)

  const chords = [
    createDominantChord(major.tones[0].pitchClass.name, 1),
    createDominantChord(major.tones[3].pitchClass.name, 4),
    createDominantChord(major.tones[4].pitchClass.name, 5),
  ] as const
  const byDegree = new Map(chords.map(chord => [chord.degree, chord]))
  const bars = FORM.map((degree, index): BluesBar => {
    const chord = byDegree.get(degree)
    if (!chord) throw new Error(`Missing blues chord degree ${degree}`)
    return {
      index,
      phrase: (Math.floor(index / 4) + 1) as BluesBar['phrase'],
      chord,
      beginsChange: index > 0 && degree !== FORM[index - 1],
    }
  })

  return {
    tonic,
    chords,
    bars,
    scale: {
      name: `${tonic.name} minor blues`,
      // Blues-scale colors favor practical fretboard names (E rather than Fb in Bb blues).
      // Dominant chord spellings remain functional and unsimplified above.
      tones: blues.tones.map(tone => ({ ...tone, pitchClass: pitchClass(Note.simplify(tone.pitchClass.name)) })),
    },
  }
}

function signedDistance(from: PitchClass, to: PitchClass) {
  return ((to.chroma - from.chroma + 18) % 12) - 6
}

/** Pairs the two defining dominant tones by the smoothest total motion. */
export function connectGuideTones(from: BluesChord, to: BluesChord): readonly GuideToneConnection[] {
  const fromGuides = from.tones.filter(tone => tone.role === 'third' || tone.role === 'seventh')
  const toGuides = to.tones.filter(tone => tone.role === 'third' || tone.role === 'seventh')
  const direct = fromGuides.map((tone, index) => ({
    from: tone,
    to: toGuides[index],
    semitones: signedDistance(tone.pitchClass, toGuides[index].pitchClass),
  }))
  const crossed = fromGuides.map((tone, index) => ({
    from: tone,
    to: toGuides[1 - index],
    semitones: signedDistance(tone.pitchClass, toGuides[1 - index].pitchClass),
  }))
  const cost = (connections: readonly GuideToneConnection[]) => connections.reduce((sum, connection) => sum + Math.abs(connection.semitones), 0)
  return cost(crossed) < cost(direct) ? crossed : direct
}

/** Places the six blues colors plus the octave tonic in a readable treble register. */
export function ascendingBluesScalePitches(scale: BluesScale): readonly Pitch[] {
  const first = pitchAtMidi(scale.tones[0].pitchClass, 60 + scale.tones[0].pitchClass.chroma)
  const pitches = scale.tones.slice(1).reduce<Pitch[]>((notes, tone) => {
    const previous = notes[notes.length - 1]
    const distance = (tone.pitchClass.chroma - previous.chroma + 12) % 12 || 12
    notes.push(pitchAtMidi(tone.pitchClass, previous.midi + distance))
    return notes
  }, [first])
  return [...pitches, pitchAtMidi(scale.tones[0].pitchClass, first.midi + 12)]
}

/** Keeps a lead-in pitch beside its target so the notated resolution is easy to read. */
export function changePhrasePitches(lead: PitchClass, target: PitchClass): readonly [Pitch, Pitch] {
  const targetPitch = pitchAtMidi(target, 60 + target.chroma)
  const below = targetPitch.midi - ((targetPitch.midi - lead.chroma + 12) % 12)
  const above = below + 12
  const leadMidi = Math.abs(targetPitch.midi - below) <= Math.abs(above - targetPitch.midi) ? below : above
  return [pitchAtMidi(lead, leadMidi), targetPitch]
}

/** Maps the home blues scale plus the selected chord's tones in one position window. */
export function createBluesFretboard(
  progression: TwelveBarBlues,
  chord: BluesChord,
  fretStart = 0,
  fretEnd = 22,
  tuning = STANDARD_TUNING,
): BluesFretboardModel {
  if (!Number.isInteger(fretStart) || !Number.isInteger(fretEnd) || fretStart < 0 || fretEnd < fretStart) {
    throw new Error('A valid ascending fret range is required')
  }
  const positions: BluesFretPosition[] = []
  tuning.forEach((open, tuningIndex) => {
    for (let fret = fretStart; fret <= fretEnd; fret++) {
      const chroma = (open.midi + fret) % 12
      const scaleTone = progression.scale.tones.find(tone => tone.pitchClass.chroma === chroma)
      const chordTone = chord.tones.find(tone => tone.pitchClass.chroma === chroma)
      if (scaleTone || chordTone) {
        positions.push({
          string: tuning.length - tuningIndex,
          fret,
          pitchClass: chordTone?.pitchClass ?? scaleTone!.pitchClass,
          scaleTone,
          chordTone,
        })
      }
    }
  })
  positions.sort((left, right) => left.string - right.string || left.fret - right.fret)
  return { tuning, fretStart, fretEnd, positions }
}
