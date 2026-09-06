import type { ChordQuality, RomanNumeral, ScaleDegree } from './types'

const DEGREES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const
export function romanNumeral(degree: ScaleDegree, quality: ChordQuality): RomanNumeral {
  const numeral = DEGREES[degree - 1]
  if (quality === 'minor') return numeral.toLowerCase()
  if (quality === 'diminished') return `${numeral.toLowerCase()}°`
  return quality === 'augmented' ? `${numeral}+` : numeral
}
