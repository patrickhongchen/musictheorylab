import { describe, expect, it } from 'vitest'
import { CAGED_FORMS, createCagedPositions, isInCagedPosition } from './cagedPositions'
import { STANDARD_TUNING } from './fretboard'
import { compareSpreadCandidates, createSpreadTriadCandidates, createSpreadTriadShapes, scoreCagedVoicing } from './spreadTriadShapes'
import { groupTriadShapeRepeats, triadShapeFamilyId } from './triadShapes'
import { createTriad } from './triads'
import type { ChordQuality, FretPosition } from './types'
import { TRIAD_VOICING_PATTERNS } from './voicingPatterns'

const key = (shape: { readonly notes: readonly FretPosition[] }) => shape.notes.map(note => `${note.string}:${note.fret}`).join('|')
const midi = (note: FretPosition) => STANDARD_TUNING[6 - note.string].midi + note.fret
const orders = [['root', 'fifth', 'third'], ['third', 'root', 'fifth'], ['fifth', 'third', 'root']]

describe('voicing patterns and CAGED regions', () => {
  it('declares all closed and spread orders with inversion determined by the bass', () => {
    expect(TRIAD_VOICING_PATTERNS.spread.map(pattern => pattern.bassToTop)).toEqual(orders)
    expect(TRIAD_VOICING_PATTERNS.closed.map(pattern => pattern.bassToTop)).toEqual([
      ['root', 'third', 'fifth'], ['third', 'fifth', 'root'], ['fifth', 'root', 'third'],
    ])
    for (const layout of Object.values(TRIAD_VOICING_PATTERNS)) {
      expect(layout.map(pattern => pattern.inversion.index)).toEqual([0, 1, 2])
      expect(layout.map(pattern => pattern.bassToTop[0])).toEqual(['root', 'third', 'fifth'])
    }
  })

  it('transposes every form, region, center and reference grip from C to D', () => {
    const c = createCagedPositions(createTriad('C', 'major'), 24).filter(position => position.anchorFret < 12)
    const d = createCagedPositions(createTriad('D', 'major'), 24)
    expect(c.map(position => position.form)).toEqual(CAGED_FORMS)
    for (const from of c) {
      const to = d.find(position => position.form === from.form && position.anchorFret === from.anchorFret + 2)!
      expect(to).toBeDefined()
      expect(to.minFret).toBe(from.minFret + 2)
      expect(to.maxFret).toBe(from.maxFret + 2)
      expect(to.handCenter).toBe(from.handCenter + 2)
      expect(to.referenceGrip.map(note => `${note.string}:${note.fret}`))
        .toEqual(from.referenceGrip.map(note => `${note.string}:${note.fret + 2}`))
      for (const note of to.referenceGrip) expect(midi(note) % 12).toBe(note.tone.pitchClass.chroma)
    }
  })

  it('clips open and upper-neck regions to valid bounds and validates fret count', () => {
    for (const root of ['C', 'E', 'G', 'B']) {
      for (const fretCount of [0, 2, 12, 22]) {
        const positions = createCagedPositions(createTriad(root, 'minor'), fretCount)
        expect(new Set(positions.map(position => position.id)).size).toBe(positions.length)
        for (const position of positions) {
          expect(position.minFret).toBeGreaterThanOrEqual(0)
          expect(position.maxFret).toBeLessThanOrEqual(fretCount)
          expect(position.referenceGrip.every(note => isInCagedPosition(note, position))).toBe(true)
        }
      }
    }
    expect(() => createSpreadTriadShapes(createTriad('C', 'major'), { fretCount: -1 })).toThrow('Fret count')
    expect(() => createCagedPositions(createTriad('C', 'major'), 2.5)).toThrow('Fret count')
  })
})

describe('ergonomic spread triads', () => {
  it.each(['major', 'minor', 'diminished', 'augmented'] as ChordQuality[])(
    'preserves roles, sounding order, spacing and region membership for %s triads in every key', quality => {
      for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']) {
        const triad = createTriad(root, quality)
        const candidates = createCagedPositions(triad).flatMap(position => createSpreadTriadCandidates(triad, position))
        expect(new Set(candidates.map(shape => shape.inversion.index)).size).toBe(3)
        for (const shape of candidates) {
          const bassToTop = [...shape.notes].sort((a, b) => midi(a) - midi(b))
          expect(bassToTop.map(note => note.tone.role)).toEqual(orders[shape.inversion.index])
          expect(shape.notes.map(note => note.tone.role).sort()).toEqual(['fifth', 'root', 'third'])
          expect(new Set(shape.notes.map(note => note.string)).size).toBe(3)
          expect(midi(shape.notes[0])).toBeGreaterThan(midi(shape.notes[1]))
          expect(midi(shape.notes[1])).toBeGreaterThan(midi(shape.notes[2]))
          expect(midi(bassToTop[2]) - midi(bassToTop[0])).toBeGreaterThanOrEqual(12)
          expect(shape.notes.every(note => isInCagedPosition(note, shape.cagedPosition))).toBe(true)
          expect(shape.ergonomicScore.fretSpan).toBeLessThanOrEqual(3)
        }
        const canonical = createSpreadTriadShapes(triad)
        const familiesByBass = new Map<string, Set<string>>()
        for (const shape of canonical) {
          const bassKey = `${shape.inversion.index}:${shape.notes[2].string}`
          const families = familiesByBass.get(bassKey) ?? new Set<string>()
          families.add(triadShapeFamilyId(shape))
          familiesByBass.set(bassKey, families)
        }
        expect([...familiesByBass.values()].every(families => families.size === 1)).toBe(true)
        expect(new Set(canonical.map(key)).size).toBe(canonical.length)
        expect(new Set(canonical.map(shape => `${shape.cagedPosition.id}:${shape.inversion.index}`)).size).toBe(canonical.length)
        expect(new Set(canonical.map(shape => {
          const bass = shape.notes[shape.notes.length - 1]
          return `${shape.inversion.index}:${bass.string}:${bass.fret}`
        })).size).toBe(canonical.length)
        expect(canonical.some(shape => shape.notes[2].string - shape.notes[0].string > 2)).toBe(true)
      }
    },
  )

  it.each([['C', 8, 3, 10], ['D', 10, 5, 12]] as const)(
    'keeps the easier E/A root grips and rejects the stretched D second inversion for %s', (root, eFret, aFret, dFret) => {
      const triad = createTriad(root, 'major')
      const shapes = createSpreadTriadShapes(triad)
      for (const [string, fret, form] of [[6, eFret, 'E'], [5, aFret, 'A']] as const) {
        const atRoot = shapes.filter(shape => shape.inversion.index === 0 && shape.notes.some(note => (
          note.tone.role === 'root' && note.string === string && note.fret === fret
        )))
        expect(atRoot).toHaveLength(1)
        expect(atRoot[0].cagedPosition.form).toBe(form)
        expect(atRoot[0].ergonomicScore.fretSpan).toBe(2)
      }
      const dPosition = createCagedPositions(triad).find(position => position.form === 'D' && position.anchorFret === dFret)!
      const stretchedKey = `2:${dFret + 3}|4:${dFret + 4}|5:${dFret}`
      expect(createSpreadTriadCandidates(triad, dPosition).map(key)).not.toContain(stretchedKey)
      expect(createSpreadTriadShapes(triad, { form: 'D' }).map(key)).not.toContain(stretchedKey)
      expect(shapes.map(key)).not.toContain(stretchedKey)
    },
  )

  it.each([['C', 8, '3:9|5:10|6:8'], ['D', 10, '3:11|5:12|6:10']] as const)(
    'prefers the reference E-form root spread for %s, excluding the mixed-position alternative', (root, anchorFret, expected) => {
      const triad = createTriad(root, 'major')
      const position = createCagedPositions(triad).find(position => position.form === 'E' && position.anchorFret === anchorFret)!
      const ranked = createSpreadTriadCandidates(triad, position)
      const rootShapes = ranked.filter(shape => shape.inversion.index === 0)
      expect(key(rootShapes[0])).toBe(expected)
      expect(rootShapes[0].ergonomicScore.referenceMisses).toBe(0)
      const mixed = rootShapes[0].notes.map(note => note.tone.role === 'fifth' ? { ...note, string: 4, fret: anchorFret - 3 } : note)
      expect(isInCagedPosition(mixed[1], position)).toBe(false)
      expect(ranked.map(key)).not.toContain(key({ notes: mixed }))
      expect(() => scoreCagedVoicing(mixed, position)).toThrow('inside one CAGED position')
      expect(key(createSpreadTriadShapes(triad, { form: 'E' }).find(shape => (
        shape.cagedPosition.anchorFret === anchorFret && shape.inversion.index === 0
      ))!)).toBe(expected)
      expect([...ranked].reverse().sort(compareSpreadCandidates)).toEqual(ranked)
      expect(createSpreadTriadCandidates(triad, position)).toEqual(ranked)
    },
  )

  it.each([['C', '1:8|2:5|4:5', '1:20|2:17|4:17'], ['D', '1:10|2:7|4:7', '1:22|2:19|4:19']] as const)(
    'retains the D-string G-form second inversion and its octave repeat for %s', (root, expected, repeat) => {
      const shapes = createSpreadTriadShapes(createTriad(root, 'major'))
      const gShape = shapes.find(shape => key(shape) === expected)!
      expect(gShape).toBeDefined()
      expect(gShape.cagedPosition.form).toBe('G')
      expect(gShape.inversion.index).toBe(2)
      expect(gShape.notes[2].string).toBe(4)
      expect(groupTriadShapeRepeats(shapes).find(group => key(group[0]) === expected)?.map(key)).toEqual([expected, repeat])
      // Sharing a top root does not make a voicing on another bass string redundant.
      expect(shapes.some(shape => shape.inversion.index === 2 && shape.notes[2].string === 5)).toBe(true)
    },
  )

  it.each(['A', 'Bb'])('keeps only the easier C-form minor second inversion on low E for %s', root => {
    const shapes = createSpreadTriadShapes(createTriad(root, 'minor'), { fretCount: 24 })
      .filter(shape => shape.inversion.index === 2 && shape.notes[2].string === 6)
    expect(shapes.length).toBeGreaterThan(0)
    expect(shapes.every(shape => shape.cagedPosition.form === 'C')).toBe(true)
    expect(new Set(shapes.map(triadShapeFamilyId)).size).toBe(1)
    expect(shapes.every(shape => shape.ergonomicScore.fretSpan === 2)).toBe(true)
  })

  it('keeps form filtering, bounded canonical sets and octave repeat grouping', () => {
    const triad = createTriad('C', 'major')
    for (const form of CAGED_FORMS) {
      const shapes = createSpreadTriadShapes(triad, { form })
      expect(shapes.length).toBeGreaterThan(0)
      expect(shapes.every(shape => shape.cagedPosition.form === form)).toBe(true)
      expect(shapes.length).toBeLessThanOrEqual(createCagedPositions(triad).filter(position => position.form === form).length * 3)
    }
    const eShapes = createSpreadTriadShapes(triad, { form: 'E', fretCount: 24 })
    const rootGroup = groupTriadShapeRepeats(eShapes).find(group => key(group[0]) === '3:9|5:10|6:8')!
    expect(rootGroup.map(key)).toEqual(['3:9|5:10|6:8', '3:21|5:22|6:20'])
    expect(createSpreadTriadShapes(triad, { fretCount: 0 })).toEqual([])
  })
})
