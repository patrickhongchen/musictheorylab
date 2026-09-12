import { describe, expect, it } from 'vitest'
import { createFretboardGeometry } from './fretboardGeometry'

describe('physical fretboard geometry', () => {
  const geometry = createFretboardGeometry({ fretCount: 22, stringCount: 6 })

  it('places open strings separately from fretted note centers', () => {
    expect(geometry.fretX(0)).toBe(73)
    expect(geometry.fretX(1)).toBe(137)
    expect(geometry.fretX(8)).toBe(627)
    expect(geometry.fretX(22)).toBe(1607)
  })

  it('maps inclusive regions to boundaries including the open-string region', () => {
    expect([geometry.fretStartX(0), geometry.fretEndX(0)]).toEqual([55, 102])
    expect([geometry.fretStartX(1), geometry.fretEndX(1)]).toEqual([102, 172])
    expect([geometry.fretStartX(8), geometry.fretEndX(8)]).toEqual([592, 662])
    expect(geometry.fretEndX(22)).toBe(geometry.endX)
  })

  it('numbers strings high to low and derives board and SVG dimensions', () => {
    expect([1, 2, 3, 4, 5, 6].map(geometry.stringY)).toEqual([40, 75, 110, 145, 180, 215])
    expect(geometry.boardWidth).toBe(1540)
    expect(geometry.endX).toBe(1642)
    expect(geometry.width).toBe(1666)
    expect(geometry.boardHeight).toBe(175)
    expect(geometry.fretLabelY).toBe(247)
    expect(geometry.height).toBe(260)
  })

  it('supports compact frets and independent vertical spacing and margins', () => {
    const compact = createFretboardGeometry({
      fretCount: 15, stringCount: 6, fretStep: 62, nutX: 110, openX: 76,
      boardTop: 46, stringSpacing: 36, fretLabelOffset: 34, bottomPadding: 26, nutOverhang: 2,
    })
    expect([compact.fretX(0), compact.fretX(1), compact.fretX(8)]).toEqual([76, 141, 575])
    expect([compact.fretStartX(8), compact.fretEndX(8)]).toEqual([544, 606])
    expect([compact.boardWidth, compact.width, compact.height]).toEqual([930, 1064, 286])
    expect([1, 2, 3, 4, 5, 6].map(compact.stringY)).toEqual([46, 82, 118, 154, 190, 226])

    const wide = createFretboardGeometry({ fretCount: 22, stringCount: 6, boardTop: 48, stringSpacing: 46, bottomPadding: 12 })
    expect(wide.stringY(6)).toBe(278)
    expect(wide.height).toBe(322)
  })

  it('places inlays at note centers and repeats octave double dots on longer boards', () => {
    const long = createFretboardGeometry({ fretCount: 36, stringCount: 6 })
    expect(long.markers.map(marker => marker.fret)).toEqual([3, 5, 7, 9, 12, 15, 17, 19, 21, 24, 27, 29, 31, 33, 36])
    expect(long.markers[0]).toEqual({ fret: 3, x: 277, ys: [127.5] })
    for (const fret of [12, 24, 36]) {
      expect(long.markers.find(marker => marker.fret === fret)).toEqual({ fret, x: long.fretX(fret), ys: [92.5, 162.5] })
    }
  })

  it('preserves single octave dots and the progression double-dot inset', () => {
    const single = createFretboardGeometry({ fretCount: 24, stringCount: 6, boardTop: 48, stringSpacing: 46, octaveDots: 'single' })
    expect(single.markers.find(marker => marker.fret === 12)?.ys).toEqual([163])
    expect(single.markers.find(marker => marker.fret === 24)?.ys).toEqual([163])
    const progression = createFretboardGeometry({ fretCount: 22, stringCount: 6, boardTop: 42, stringSpacing: 46, doubleDotInset: 52.5 })
    expect(progression.markers.find(marker => marker.fret === 12)?.ys).toEqual([94.5, 219.5])
  })

  it.each([0, 1, 4, 10, 17, 23, 25, 37])('limits frets and markers to a %i-fret board', fretCount => {
    const board = createFretboardGeometry({ fretCount, stringCount: 6 })
    expect(board.frets).toHaveLength(fretCount + 1)
    expect(board.frets.at(-1)).toBe(fretCount)
    expect(board.markers.every(marker => marker.fret > 0 && marker.fret <= fretCount)).toBe(true)
    expect(board.width).toBe(126 + fretCount * 70)
  })

  it('supports a fret range without shifting its physical coordinates', () => {
    const range = createFretboardGeometry({ fretStart: 5, fretCount: 9, stringCount: 4 })
    expect(range.frets).toEqual([5, 6, 7, 8, 9])
    expect(range.markers.map(marker => marker.fret)).toEqual([5, 7, 9])
    expect(range.fretX(5)).toBe(geometry.fretX(5))
    expect(range.fretStartX(0)).toBe(55)
    expect(range.boardBottom).toBe(145)
    expect(range.width).toBe(756)
  })
})
