import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createMajorSeventh, createMajorSeventhShapes } from '../music/majorSeventhShapes'
import { createTriadShapesFromTemplates } from '../music/triadShapeTemplates'
import { createTriad } from '../music/triads'
import { ChordShapeFretboard, shapeInspection } from './ChordShapeFretboard'

const seventh = createMajorSeventhShapes(createMajorSeventh('C')).find(shape => (
  [...shape.notes].reverse().map(note => note.tone.role).join(',') === 'root,seventh,third,fifth'
))!

describe('shared chord fretboard', () => {
  it('inspects non-tertian Major 7 root voicings with note names and roles', () => {
    const inspection = shapeInspection(seventh, [seventh])
    expect(inspection.title).toContain('Root position')
    expect(inspection.notes).toBe('C (R) → B (7) → E (3) → G (5)')
  })

  it('renders direct single-form and combination CAGED metadata unchanged', () => {
    const shapes = createMajorSeventhShapes(createMajorSeventh('C'))
    expect(shapeInspection(shapes.find(shape => shape.templateId === 'drop2-top4-third')!, []).cagedLabel).toBe('E-shape')
    expect(shapeInspection(shapes.find(shape => shape.templateId === 'drop2-top4-first')!, []).cagedLabel).toBe('C / A combination')
  })

  it('renders triads and skipped-string Major 7 shapes together with all four interval labels', () => {
    const triad = createTriadShapesFromTemplates(createTriad('G', 'major'), 'closed')[0]
    const markup = renderToStaticMarkup(createElement(ChordShapeFretboard, {
      allShapes: [triad, seventh], shapes: [triad, seventh], selected: [seventh],
      hovered: undefined, onHover: () => {}, onSelect: () => {}, fretCount: 22,
    }))
    for (const label of ['R', '3', '5', '7']) expect(markup).toContain(`>${label}</text>`)
    // Each base shape and pinned overlay renders only its sounding strings.
    expect(markup.match(/<circle r="(?:9|16)"/g)).toHaveLength(3 + 4 + 4)
  })
})
