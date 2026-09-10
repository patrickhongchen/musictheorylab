import { CAGED_TEMPLATES, type CagedForm } from './cagedPositions'
import { STANDARD_TUNING } from './fretboard'
import type { MajorSeventhChord, PlayableChordNote, PlayableChordToneRole } from './chordShapes'

/** A contribution from a CAGED arpeggio pattern, with exact matched notes. */
export interface MajorSeventhCagedRegion {
  readonly form: CagedForm
  readonly anchorString: number
  readonly anchorFret: number
  readonly minFret: number
  readonly maxFret: number
  readonly matchedNotes: readonly PlayableChordNote[]
}

/**
 * Root-relative Major 7 arpeggio coordinates in standard tuning. These include
 * chord tones around the full CAGED grip, not just its six-note strum shape.
 * In particular, C includes the high-string fifth; A includes the G-string
 * seventh. Keep these separate from the generous triad hand-region windows.
 */
const REFERENCES: Record<CagedForm, readonly (readonly [number, number, PlayableChordToneRole])[]> = {
  C: [[6,-3,'third'],[6,0,'fifth'],[5,-1,'seventh'],[5,0,'root'],[4,-1,'third'],[3,-3,'fifth'],[2,-3,'seventh'],[2,-2,'root'],[1,-3,'third'],[1,0,'fifth']],
  A: [[6,0,'fifth'],[5,0,'root'],[4,2,'fifth'],[3,1,'seventh'],[3,2,'root'],[2,2,'third'],[1,0,'fifth']],
  G: [[6,-1,'seventh'],[6,0,'root'],[5,-1,'third'],[4,-3,'fifth'],[3,-3,'root'],[2,-3,'third'],[1,-1,'seventh'],[1,0,'root']],
  E: [[6,0,'root'],[5,2,'fifth'],[4,1,'seventh'],[4,2,'root'],[3,1,'third'],[2,0,'fifth'],[1,0,'root']],
  D: [[6,-3,'seventh'],[6,-2,'root'],[6,2,'third'],[5,-3,'third'],[5,0,'fifth'],[4,0,'root'],[3,-1,'third'],[3,2,'fifth'],[2,2,'seventh'],[2,3,'root'],[1,2,'third']],
}

/** Prefer a complete single-pattern match; otherwise choose a supported neighboring pair. */
export function majorSeventhCagedRegions(
  chord: MajorSeventhChord,
  notes: readonly PlayableChordNote[],
  fretCount: number,
): readonly MajorSeventhCagedRegion[] {
  if (!notes.length) return []
  const candidates = CAGED_TEMPLATES.flatMap(template => {
    const coordinates = REFERENCES[template.form]
    const anchors = new Set(notes.flatMap(note => coordinates
      .filter(([string, , role]) => string === note.string && role === note.tone.role)
      .map(([, offset]) => note.fret - offset)))
    return [...anchors].sort((a, b) => a - b).flatMap(anchorFret => {
      if (((template.anchorChroma + anchorFret) % 12 + 12) % 12 !== chord.root.chroma) return []
      const matchedNotes = notes.filter(note => coordinates.some(([string, offset, role]) => (
        string === note.string && anchorFret + offset === note.fret && role === note.tone.role
        && (STANDARD_TUNING[6 - string].midi + note.fret) % 12 === note.tone.pitchClass.chroma
      )))
      if (!matchedNotes.length) return []
      return [{ form: template.form, anchorString: template.anchorString, anchorFret,
        minFret: Math.max(0, anchorFret + Math.min(...coordinates.map(([, offset]) => offset))),
        maxFret: Math.min(fretCount, anchorFret + Math.max(...coordinates.map(([, offset]) => offset))), matchedNotes }]
    })
  })
  const complete = candidates.filter(candidate => candidate.matchedNotes.length === notes.length)
  if (complete.length) return complete
  // Only neighboring CAGED patterns at neighboring neck occurrences can form
  // a combination. Rank actual pairs; never union alternative explanations.
  const pairs: MajorSeventhCagedRegion[][] = []
  for (let left = 0; left < candidates.length; left++) {
    for (let right = left + 1; right < candidates.length; right++) {
      const a = candidates[left]
      const b = candidates[right]
      const ai = CAGED_TEMPLATES.findIndex(template => template.form === a.form)
      const bi = CAGED_TEMPLATES.findIndex(template => template.form === b.form)
      const distance = Math.abs(ai - bi)
      if (distance !== 1 && distance !== 4) continue
      const centerA = a.anchorFret + CAGED_TEMPLATES[ai].centerOffset
      const centerB = b.anchorFret + CAGED_TEMPLATES[bi].centerOffset
      if (Math.abs(centerA - centerB) > 5) continue
      if (notes.every(note => a.matchedNotes.includes(note) || b.matchedNotes.includes(note))) pairs.push([a, b])
    }
  }
  pairs.sort((a, b) => (
    b.reduce((sum, region) => sum + region.matchedNotes.length, 0)
    - a.reduce((sum, region) => sum + region.matchedNotes.length, 0)
  ))
  return pairs[0] ?? []
}
