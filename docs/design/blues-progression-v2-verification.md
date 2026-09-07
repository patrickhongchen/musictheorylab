# Blues progression workbench — implementation verification

This pass supersedes the fixed 12-bar Blues Soloing design. It implements the contract in `blues-progression-v2-spec.md` and uses the generated desktop and mobile concepts as the visual reference.

## Fidelity ledger

| Area | Concept intent | Implemented result |
| --- | --- | --- |
| Page hierarchy | Intro, progression, selected sound, staff, fretboard | Same order and restrained editorial layout |
| Progression | Selectable numbered chord/scale cards | Horizontal rail with stable selection, add, move, duplicate, and delete |
| Editor | Chord root/type plus independent scale root/type | Four direct selects with the requested six qualities and seven scales |
| Current sound | Current and next harmony side by side | Live summary isolated from a dedicated view-controls toolbar, preventing long scale names from colliding with the next-chord control |
| Staff | Scale from tonic to tonic with chord emphasis | VexFlow notation with a shared Both/Chord/Scale filter, the exact fretboard role palette, compact 16px regular-weight degree and pitch-class labels, numeral-centered accidentals, ascending pitch order, and amber diamonds marking out-of-scale chord tones |
| Fretboard | One legible full-neck map | Standard tuning, frets 0–22, local horizontal scroll, Notes/Degrees labels; equal-size neutral scale and mint/green current-chord markers, with amber-diamond out-of-scale tones |
| Overlay | Optional look-ahead | Compact, consistently labeled next-chord switch adds independent blue dashed halos on both staff and fretboard |
| Legend | Explain marker roles without competing with controls | Separate one-line symbol-and-role key; treatment details remain available to assistive technology |
| Responsive | Compact mobile controls and locally scrolling diagrams | Verified in a 390px-wide browser capture with wrapped filter controls and local diagram scrolling |

The concepts supplied the visual hierarchy, spacing, typography, palette, and interaction grouping. Tonal and VexFlow remain the authority for pitch spelling and notation, correcting the illustrative note content in the generated concepts.

## Interaction verification

- Selected and edited a chord and its independent scale.
- Toggled the immediate next chord, switched Notes/Degrees labels, and exercised Both/Chord/Scale filtering across the staff and fretboard.
- Verified Scale mode disables chord overlays without discarding the next-chord preference, which returns in Both or Chord mode.
- Added, reordered, duplicated, and deleted progression steps while preserving selection.
- Confirmed the final progression step previews step one.
- Confirmed staff and fretboard descriptions update with all state changes.
- Confirmed staff pitch labels omit octave numbers and flattened degrees keep their numeral and pitch letter on the notehead center axis.
- Confirmed the browser console contains no runtime errors.

## Automated verification

- `npm test`: 215 tests passed across 4 files.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed. Vite reports only its advisory large-chunk warning for the VexFlow font bundle.

## Review artifacts

- `blues-progression-concept-v2.png`
- `blues-progression-mobile-v2.png`
- `blues-progression-implementation-desktop.png`
- `blues-progression-implementation-mobile.png`
