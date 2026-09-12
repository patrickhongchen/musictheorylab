import { describe, expect, it } from 'vitest'
import {
  CAGED_FORMS, CAGED_FORM_DEFINITIONS, cagedAnchorFromRoot, createCagedPositions,
  firstCagedAnchor, getCagedForm, getCagedRootReference, placeCagedForm,
  validateCagedAssociations, validateCagedDefinition,
  type CagedChordQuality, type CagedForm, type CagedFormDefinition,
} from './caged'
import { STANDARD_TUNING, createScaleToneFretboard } from './fretboard'
import { pitchClass } from './pitches'
import { createExplorerScale } from './scales'

const roots = ['C', 'Db', 'F#', 'A', 'Bb', 'Cb'] as const

describe('canonical CAGED reference system', () => {
  it('defines all five forms once, with quality-independent primary roots', () => {
    expect(CAGED_FORMS).toEqual(['C', 'A', 'G', 'E', 'D'])
    expect(CAGED_FORM_DEFINITIONS.map(definition => definition.form)).toEqual(CAGED_FORMS)
    expect(CAGED_FORMS.map(form => getCagedRootReference(form))).toEqual([
      { string: 5, fretOffset: 3, role: 'root' },
      { string: 5, fretOffset: 0, role: 'root' },
      { string: 6, fretOffset: 3, role: 'root' },
      { string: 6, fretOffset: 0, role: 'root' },
      { string: 4, fretOffset: 0, role: 'root' },
    ])
    for (const definition of CAGED_FORM_DEFINITIONS) expect(() => validateCagedDefinition(definition)).not.toThrow()
  })

  it.each([
    ['C', [0, 3, 5, 8, 10]],
    ['F#', [6, 9, 11, 2, 4]],
    ['Bb', [10, 1, 3, 6, 8]],
    ['A', [9, 0, 2, 5, 7]],
  ] as const)('locates the virtual nuts for %s', (tonic, expected) => {
    expect(CAGED_FORMS.map(form => firstCagedAnchor(tonic, form))).toEqual(expected)
  })

  it.each(['major', 'minor'] as const)('places valid %s chord tones across tonics, boundaries, and octaves', quality => {
    const intervals = { root: 0, third: quality === 'major' ? 4 : 3, fifth: 7 }
    for (const tonic of roots) {
      for (const fretCount of [0, 1, 2, 12, 18, 22, 35]) {
        const positions = createCagedPositions(tonic, quality, fretCount)
        for (const position of positions) {
          expect(position.startFret).toBeGreaterThanOrEqual(0)
          expect(position.endFret).toBeLessThanOrEqual(fretCount)
          expect(position.startFret).toBeLessThanOrEqual(position.endFret)
          expect(position.anchorFret % 12).toBe(firstCagedAnchor(tonic, position.form))
          for (const tone of position.chordTones) {
            expect(tone.fret).toBeGreaterThanOrEqual(0)
            expect(tone.fret).toBeLessThanOrEqual(fretCount)
            const chroma = (pitchClass(tonic).chroma + intervals[tone.role]) % 12
            expect(tone.pitchClass.chroma).toBe(chroma)
            expect((STANDARD_TUNING[6 - tone.string].midi + tone.fret) % 12).toBe(chroma)
            if (tone.role === 'root') expect(cagedAnchorFromRoot(position.form, tone.string, tone.fret)).toBe(position.anchorFret)
          }
        }
        if (fretCount >= 12) expect(new Set(positions.map(position => position.form)).size).toBe(5)
      }
      const positions = createCagedPositions(tonic, quality, 35)
      for (const first of positions.filter(position => position.anchorFret < 12)) {
        const repeat = positions.find(position => position.form === first.form && position.anchorFret === first.anchorFret + 12)!
        expect(repeat).toBeDefined()
        for (const tone of first.chordTones) {
          expect(repeat.chordTones).toContainEqual({ ...tone, fret: tone.fret + 12 })
        }
      }
    }
  })

  it('clips negative minor reference points without discarding the open-position region', () => {
    const c = placeCagedForm('C', 'minor', 'C', 0, 22)
    expect([c.startFret, c.endFret]).toEqual([0, 3])
    expect(c.chordTones.some(tone => tone.string === 1)).toBe(false)
    expect(placeCagedForm('C', 'minor', 'C', 12, 22).chordTones).toContainEqual({
      string: 1, fret: 11, role: 'third', pitchClass: pitchClass('Eb'),
    })
    expect(placeCagedForm('C', 'major', 'D', 22, 22)).toMatchObject({ startFret: 21, endFret: 22 })
  })

  it('keeps CAGED references within each Scale Explorer scale, including enharmonic spelling', () => {
    for (const tonic of roots) {
      for (const type of ['ionian', 'aeolian', 'majorPentatonic', 'minorPentatonic'] as const) {
        const scale = createExplorerScale(tonic, type)
        const board = createScaleToneFretboard(scale, STANDARD_TUNING, 22)
        for (const position of createCagedPositions(tonic, scale.tonicChordQuality)) {
          for (const note of position.chordTones) {
            const scaleNote = board.positions.find(candidate => candidate.string === note.string && candidate.fret === note.fret)
            expect(scaleNote?.tone.pitchClass).toEqual(note.pitchClass)
          }
        }
      }
    }
  })

  it('distinguishes root frets from virtual nuts and permits virtual references below the nut', () => {
    expect(cagedAnchorFromRoot('C', 2, 1)).toBe(0)
    expect(cagedAnchorFromRoot('C', 5, 3)).toBe(0)
    expect(cagedAnchorFromRoot('G', 1, 0)).toBe(-3)
    expect(() => cagedAnchorFromRoot('C', 3, 0)).toThrow('no root reference')
    expect(() => cagedAnchorFromRoot('E', 6, -1)).toThrow('Root fret')
  })

  it('accepts zero, one, or multiple curated associations and rejects invalid references', () => {
    for (const forms of [[], ['C'], ['C', 'A']] as const) expect(() => validateCagedAssociations(forms)).not.toThrow()
    expect(() => validateCagedAssociations(['C', 'C'])).toThrow('duplicate form')
    expect(() => validateCagedAssociations(['H' as CagedForm])).toThrow('Unknown CAGED form')
  })

  it('rejects malformed reference geometry before fretboard clipping can hide it', () => {
    const c = getCagedForm('C')
    const malformed: readonly CagedFormDefinition[] = [
      { ...c, openRootChroma: 1 },
      { ...c, regionStartOffset: 4 },
      { ...c, regionEndOffset: 1.5 },
      { ...c, primaryRootString: 3 },
      ...[
        { string: 7, fretOffset: 0, role: 'third' as const },
        { string: 1, fretOffset: -2, role: 'third' as const },
        { string: 1, fretOffset: -0.5, role: 'third' as const },
        { string: 1, fretOffset: 0, role: 'third' as const }, // Wrong minor third even though the original reference is below the nut.
      ].map(tone => ({ ...c, chordTones: { ...c.chordTones, minor: [...c.chordTones.minor.filter(note => note.string !== 1), tone] } })),
      { ...c, chordTones: { ...c.chordTones, major: c.chordTones.major.filter(tone => tone.role !== 'fifth') } },
      { ...c, chordTones: { ...c.chordTones, major: [...c.chordTones.major, c.chordTones.major[0]] } },
    ]
    for (const definition of malformed) expect(() => validateCagedDefinition(definition)).toThrow('Invalid CAGED geometry')
  })

  it('fails clearly for invalid placement inputs', () => {
    for (const fretCount of [-1, 1.5, Infinity, NaN]) {
      expect(() => createCagedPositions('C', 'major', fretCount)).toThrow('Fret count')
    }
    expect(() => createCagedPositions('nonsense', 'major')).toThrow()
    expect(() => createCagedPositions('C', 'major7' as CagedChordQuality, 0)).toThrow('Unsupported CAGED reference quality')
    for (const anchor of [-1, 1, 0.5, 24]) {
      expect(() => placeCagedForm('C', 'major', 'C', anchor, 22)).toThrow('Invalid CAGED anchor')
    }
  })
})
