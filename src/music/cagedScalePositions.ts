/** Scale Explorer compatibility adapter. All reference geometry and placement live in caged.ts. */
import { CAGED_FORM_DEFINITIONS } from './caged'

export {
  CAGED_FORMS,
  createCagedPositions as createCagedScalePositions,
  type CagedChordQuality,
  type CagedChordToneCoordinate,
  type CagedPosition as CagedScalePosition,
} from './caged'

/** Legacy flattened view, derived from the canonical form definitions. */
export const CAGED_SCALE_POSITION_TEMPLATES = (['major', 'minor'] as const).flatMap(quality => (
  CAGED_FORM_DEFINITIONS.map(definition => ({
    form: definition.form, quality, openRootChroma: definition.openRootChroma,
    regionStartOffset: definition.regionStartOffset, regionEndOffset: definition.regionEndOffset,
    chordTones: definition.chordTones[quality],
  }))
))
export type CagedScalePositionTemplate = typeof CAGED_SCALE_POSITION_TEMPLATES[number]
