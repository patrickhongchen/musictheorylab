import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CAGED_FORMS, createCagedPositions, placeCagedForm, type CagedForm, type CagedPosition } from '../../music/caged'
import { CagedRegionOverlay } from './CagedRegionOverlay'
import { createFretboardGeometry } from './fretboardGeometry'

const geometry = createFretboardGeometry({ fretCount: 22, stringCount: 6, boardTop: 76 })
const positions = createCagedPositions('C', 'major', 36)
const render = (regions: readonly CagedPosition[], activeForm: 'all' | CagedForm = 'all', board = geometry) => (
  renderToStaticMarkup(createElement(CagedRegionOverlay, { geometry: board, positions: regions, activeForm }))
)

describe('CAGED region overlay', () => {
  it('renders canonical positions on the five canonical lanes, including repeats', () => {
    const markup = render(positions)
    for (const [index, form] of CAGED_FORMS.entries()) {
      const regions = positions.filter(position => position.form === form && position.startFret <= 22)
      expect(regions.length).toBeGreaterThan(1)
      expect(markup.match(new RegExp(`>${form}</text>`, 'g'))).toHaveLength(regions.length)
      const lane = render([regions[0]])
      expect(lane).toContain(`y="${10 + index * 10}"`)
      expect(lane).toContain(`y="${16 + index * 10}"`)
    }
    expect(markup).not.toContain('opacity="0.28"')
  })

  it('uses inclusive fret boundaries, including the open-string region', () => {
    const open = placeCagedForm('C', 'major', 'C', 0)
    expect(render([open])).toContain('x="55" y="10" width="257"')
    const repeated = placeCagedForm('C', 'major', 'C', 12)
    expect(render([repeated])).toContain('x="802" y="10" width="350"')
    const compact = createFretboardGeometry({ fretCount: 22, stringCount: 6, fretStep: 62, nutX: 110 })
    expect(render([repeated], 'all', compact)).toContain('x="730" y="10" width="310"')
  })

  it('emphasizes every selected-form repeat and dims other lanes', () => {
    const visible = createCagedPositions('C', 'minor', 22)
    const markup = render(visible, 'E')
    const activeCount = visible.filter(position => position.form === 'E').length
    expect(markup.match(/class="caged-region is-active"/g)).toHaveLength(activeCount)
    expect(markup.match(/class="caged-region-label is-active"/g)).toHaveLength(activeCount)
    expect(markup.match(/opacity="1"/g)).toHaveLength(activeCount)
    expect(markup.match(/opacity="0.28"/g)).toHaveLength(visible.length - activeCount)
  })

  it('clips canonical regions from a longer model to the supplied board and omits off-board repeats', () => {
    const short = createFretboardGeometry({ fretCount: 2, stringCount: 6 })
    expect(render(positions, 'all', short)).toContain('x="55" y="10" width="187"')
    expect(render(positions, 'all', short).match(/class="caged-region"/g)).toHaveLength(2)
    const range = createFretboardGeometry({ fretStart: 2, fretCount: 2, stringCount: 6 })
    expect(render(positions, 'all', range)).toContain('x="172" y="10" width="70"')
    const openOnly = createFretboardGeometry({ fretCount: 0, stringCount: 6 })
    expect(render(positions, 'all', openOnly)).toContain('x="55" y="10" width="47"')
  })
})
