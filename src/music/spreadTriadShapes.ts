import { createCagedPositions, isInCagedPosition, type CagedForm, type CagedPosition } from './cagedPositions'
import { STANDARD_TUNING } from './fretboard'
import { triadShapeFamilyId, type TriadShape } from './triadShapes'
import type { ChordTone, FretPosition, IndependentTriad } from './types'
import { TRIAD_VOICING_PATTERNS } from './voicingPatterns'

export interface ErgonomicScore {
  readonly referenceMisses: number
  readonly fretSpan: number
  readonly centerDistance: number
  readonly stringGapPenalty: number
}

export interface SpreadTriadShape extends TriadShape {
  readonly layout: 'spread'
  readonly cagedPosition: CagedPosition
  readonly ergonomicScore: ErgonomicScore
}

const midi = (note: FretPosition) => STANDARD_TUNING[6 - note.string].midi + note.fret
const physicalKey = (notes: readonly FretPosition[]) => notes.map(note => `${note.string}:${note.fret}`).join('|')
const MAX_SPREAD_FRET_SPAN = 3

/** Prefer a smaller stretch before reference-grip membership, hand travel and string gaps. */
export function scoreCagedVoicing(notes: readonly FretPosition[], position: CagedPosition): ErgonomicScore {
  if (notes.length === 0 || notes.some(note => !isInCagedPosition(note, position))) {
    throw new Error('Voicing must remain inside one CAGED position')
  }
  const frets = notes.map(note => note.fret)
  const strings = notes.map(note => note.string).sort((a, b) => a - b)
  return {
    referenceMisses: notes.filter(note => !position.referenceGrip.some(reference => (
      reference.string === note.string && reference.fret === note.fret && reference.tone.role === note.tone.role
    ))).length,
    fretSpan: Math.max(...frets) - Math.min(...frets),
    centerDistance: frets.reduce((total, fret) => total + Math.abs(fret - position.handCenter), 0),
    // A single skipped string is normal; penalize only larger gaps.
    stringGapPenalty: strings.slice(1).reduce((total, string, index) => total + Math.max(0, string - strings[index] - 2) ** 2, 0),
  }
}

export function compareSpreadCandidates(left: SpreadTriadShape, right: SpreadTriadShape): number {
  for (const criterion of ['fretSpan', 'referenceMisses', 'centerDistance', 'stringGapPenalty'] as const) {
    const difference = left.ergonomicScore[criterion] - right.ergonomicScore[criterion]
    if (difference) return difference
  }
  const leftKey = `${physicalKey(left.notes)}:${left.cagedPosition.id}`
  const rightKey = `${physicalKey(right.notes)}:${right.cagedPosition.id}`
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0
}

/** Region-local placement, independent of the number or names of requested roles. */
function placeOrderedTones(tones: readonly ChordTone[], position: CagedPosition): readonly (readonly FretPosition[])[] {
  const choices = tones.map(tone => {
    const notes: FretPosition[] = []
    for (let string = 6; string >= 1; string--) {
      for (let fret = position.minFret; fret <= position.maxFret; fret++) {
        if ((STANDARD_TUNING[6 - string].midi + fret) % 12 === tone.pitchClass.chroma) notes.push({ string, fret, tone })
      }
    }
    return notes
  })
  const results: FretPosition[][] = []
  function visit(placed: FretPosition[]) {
    if (placed.length === tones.length) {
      results.push(placed)
      return
    }
    for (const note of choices[placed.length]) {
      const previous = placed[placed.length - 1]
      // Keep normal low-to-high string geometry AND verify actual sounding order.
      if (previous && (note.string >= previous.string || midi(note) <= midi(previous))) continue
      const frets = [...placed.map(note => note.fret), note.fret]
      if (Math.max(...frets) - Math.min(...frets) > MAX_SPREAD_FRET_SPAN) continue
      visit([...placed, note])
    }
  }
  visit([])
  return results
}

/** All valid spread candidates in one hand region, ranked for independent inspection/testing. */
export function createSpreadTriadCandidates(triad: IndependentTriad, position: CagedPosition): readonly SpreadTriadShape[] {
  if (triad.tones.length !== 3 || !['root', 'third', 'fifth'].every(role => triad.tones.some(tone => tone.role === role))) {
    throw new Error('Spread triads require one root, third, and fifth')
  }
  const candidates: SpreadTriadShape[] = []
  for (const pattern of TRIAD_VOICING_PATTERNS.spread) {
    const tones = pattern.bassToTop.map(role => triad.tones.find(tone => tone.role === role)!)
    for (const bassToTop of placeOrderedTones(tones, position)) {
      if (midi(bassToTop[bassToTop.length - 1]) - midi(bassToTop[0]) < 12) continue
      const notes = [...bassToTop].reverse()
      candidates.push({
        id: `${triad.id}:spread:${position.id}:${physicalKey(notes)}`,
        triad, notes, inversion: pattern.inversion, layout: 'spread', cagedPosition: position,
        ergonomicScore: scoreCagedVoicing(notes, position),
      })
    }
  }
  return candidates.sort(compareSpreadCandidates)
}

/**
 * One preferred candidate per region/inversion, then one shape family per
 * inversion and bass string across the neck. Retain only octave repeats of
 * that winning geometry, not a different grip near the nut or final fret.
 * A form filter scopes the choices before ranking.
 */
export function createSpreadTriadShapes(
  triad: IndependentTriad,
  { form, fretCount = 22 }: { readonly form?: CagedForm; readonly fretCount?: number } = {},
): readonly SpreadTriadShape[] {
  const canonical = createCagedPositions(triad, fretCount)
    .filter(position => !form || position.form === form)
    .flatMap(position => {
      const ranked = createSpreadTriadCandidates(triad, position)
      return TRIAD_VOICING_PATTERNS.spread.flatMap(pattern => {
        const best = ranked.find(shape => shape.inversion.index === pattern.inversion.index)
        return best ? [best] : []
      })
    }).sort(compareSpreadCandidates)
  const unique = new Map<string, SpreadTriadShape>()
  const bassFamilies = new Map<string, string>()
  for (const shape of canonical) {
    const key = physicalKey(shape.notes)
    const bass = shape.notes[shape.notes.length - 1]
    const occurrence = `${shape.inversion.index}:${bass.string}`
    const family = triadShapeFamilyId(shape)
    const preferredFamily = bassFamilies.get(occurrence)
    if (unique.has(key) || (preferredFamily !== undefined && preferredFamily !== family)) continue
    unique.set(key, shape)
    bassFamilies.set(occurrence, family)
  }
  return [...unique.values()].sort((a, b) => (
    a.cagedPosition.anchorFret - b.cagedPosition.anchorFret
    || a.inversion.index - b.inversion.index || compareSpreadCandidates(a, b)
  ))
}
