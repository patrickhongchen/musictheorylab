interface FretboardGeometryOptions {
  readonly fretCount: number
  readonly stringCount: number
  /** First numbered/drawn fret. Coordinates remain relative to the physical nut. */
  readonly fretStart?: number
  readonly fretStep?: number
  readonly nutX?: number
  readonly openX?: number
  readonly boardTop?: number
  readonly stringSpacing?: number
  readonly fretLabelOffset?: number
  readonly bottomPadding?: number
  readonly nutOverhang?: number
  readonly octaveDots?: 'single' | 'double'
  readonly doubleDotInset?: number
}

/** Physical drawing coordinates only; tuning and musical positions belong to the model. */
export function createFretboardGeometry({
  fretCount, stringCount, fretStart = 0, fretStep = 70, nutX = 102, openX = 73,
  boardTop = 40, stringSpacing = 35, fretLabelOffset = 32, bottomPadding = 13,
  nutOverhang = 1, octaveDots = 'double', doubleDotInset = stringSpacing * 1.5,
}: FretboardGeometryOptions) {
  const stringStartX = 55
  const rightPadding = 24
  const boardHeight = Math.max(0, stringCount - 1) * stringSpacing
  const boardBottom = boardTop + boardHeight
  const boardWidth = fretCount * fretStep
  const endX = nutX + boardWidth
  const fretLabelY = boardBottom + fretLabelOffset
  const fretX = (fret: number) => fret === 0 ? openX : nutX + (fret - 0.5) * fretStep
  const stringY = (string: number) => boardTop + (string - 1) * stringSpacing
  // The open-string region occupies the space between the string start and nut.
  const fretStartX = (fret: number) => fret === 0 ? stringStartX : nutX + (fret - 1) * fretStep
  const fretEndX = (fret: number) => nutX + fret * fretStep
  const frets = Array.from({ length: fretCount - fretStart + 1 }, (_, index) => fretStart + index)
  const markers = frets.filter(fret => fret > 0 && [0, 3, 5, 7, 9].includes(fret % 12)).map(fret => ({
    fret,
    x: fretX(fret),
    ys: fret % 12 === 0 && octaveDots === 'double'
      ? [boardTop + doubleDotInset, boardBottom - doubleDotInset]
      : [(boardTop + boardBottom) / 2],
  }))
  return {
    fretCount, fretStart, nutX, stringStartX,
    boardTop, boardBottom, boardHeight, boardWidth, endX, fretLabelY, nutOverhang,
    width: endX + rightPadding, height: fretLabelY + bottomPadding,
    frets, markers, fretX, stringY, fretStartX, fretEndX,
  }
}

export type FretboardGeometry = ReturnType<typeof createFretboardGeometry>
