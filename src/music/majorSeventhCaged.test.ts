import { describe, expect, it } from 'vitest'
import { createMajorSeventh, createMajorSeventhShapes } from './majorSeventhShapes'
import { chordShapeFamilyId } from './chordShapes'
import { shapeCagedLabel } from '../components/ChordShapeFretboard'

const roots = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

describe('Major 7 CAGED region compatibility', () => {
  it('covers all twelve templates in every key with exact pattern contributions covering every sounding note', () => {
    for (const root of roots) {
      const shapes = createMajorSeventhShapes(createMajorSeventh(root))
      expect(new Set(shapes.map(shape => shape.templateId)).size).toBe(12)
      for (const shape of shapes) {
        expect(shape.compatibleCagedRegions!.length).toBeGreaterThan(0)
        expect(shape.notes.every(note => shape.compatibleCagedRegions!.some(region => region.matchedNotes.includes(note)))).toBe(true)
      }
    }
  })

  it('retains explicit primary families and distinguishes ambiguous regions in display', () => {
    const shapes = createMajorSeventhShapes(createMajorSeventh('C'))
    const third = shapes.find(shape => shape.templateId === 'drop2-top4-third')!
    expect(third.cagedForm).toBeUndefined()
    expect(shapeCagedLabel(third)).toBe('E-shape')
    const root = shapes.find(shape => shape.templateId === 'a-root-r573')!
    expect(shapeCagedLabel(root)).toBe('A-shape')
    expect(shapeCagedLabel(shapes.find(shape => shape.templateId === 'drop2-top4-first')!)).toBe('C / A combination')
    const eRoot = shapes.find(shape => shape.templateId === 'e-root-r735')!
    expect(eRoot.compatibleCagedRegions!.map(region => region.form)).toEqual(['E'])
    expect(shapeCagedLabel(eRoot)).toBe('E-shape')
  })

  it('recognizes both pictured voicings as complete D shapes in every key', () => {
    for (const root of roots) {
      const shapes = createMajorSeventhShapes(createMajorSeventh(root), { fretCount: 36 })
      for (const id of ['e-first-3r57', 'a-second-5r37']) {
        const matches = shapes.filter(shape => shape.templateId === id)
        expect(matches.length).toBeGreaterThan(0)
        for (const shape of matches) {
          expect(shapeCagedLabel(shape)).toBe('D-shape')
          expect(shape.compatibleCagedRegions!.map(region => region.form)).toEqual(['D'])
          expect(shape.compatibleCagedRegions![0].matchedNotes).toHaveLength(4)
        }
      }
    }
  })

  it('never merges alternate covers or labels nonadjacent patterns as a combination', () => {
    const order = ['C', 'A', 'G', 'E', 'D']
    for (const root of roots) {
      for (const shape of createMajorSeventhShapes(createMajorSeventh(root))) {
        const regions = shape.compatibleCagedRegions!
        if (regions.some(region => region.matchedNotes.length === 4)) continue
        expect(regions).toHaveLength(2)
        const distance = Math.abs(order.indexOf(regions[0].form) - order.indexOf(regions[1].form))
        expect([1, 4]).toContain(distance)
        expect(shape.notes.every(note => regions.some(region => region.matchedNotes.includes(note)))).toBe(true)
      }
    }
  })

  it('keeps associations under semitone and octave translation, including neck boundaries', () => {
    for (let index = 0; index < roots.length; index++) {
      const shapes = createMajorSeventhShapes(createMajorSeventh(roots[index]), { fretCount: 36 })
      const next = createMajorSeventhShapes(createMajorSeventh(roots[(index + 1) % 12]), { fretCount: 37 })
      for (const shape of shapes) {
        const shifted = next.find(candidate => candidate.templateId === shape.templateId && candidate.rootAnchor!.fret === shape.rootAnchor!.fret + 1)!
        expect(shifted).toBeDefined()
        expect(shifted.compatibleCagedRegions!.map(region => [region.form, region.anchorFret - 1]))
          .toEqual(shape.compatibleCagedRegions!.map(region => [region.form, region.anchorFret]))
        const octave = shapes.find(candidate => candidate.templateId === shape.templateId && candidate.rootAnchor!.fret === shape.rootAnchor!.fret + 12)
        if (octave) {
          expect(octave.compatibleCagedRegions!.map(region => region.form)).toEqual(shape.compatibleCagedRegions!.map(region => region.form))
          expect(chordShapeFamilyId(octave)).toBe(chordShapeFamilyId(shape))
        }
      }
    }
  })
})
