# Design and browser verification

The built-in Image Gen concept (`concept.png`) is the visual reference. It was inspected with `view_image` before implementation and again alongside final connected-Chrome screenshots (`desktop.png`, `mobile.png`). No Playwright standalone fallback was needed. Browser interaction used the connected browser's Playwright API; screenshots used its native screenshot API.

Checked a 1347×1168 desktop viewport matching the concept dimensions, the browser's original viewport, 390×844 mobile and 320×740 narrow mobile. Full-page captures include the content below the viewport. Native scrollbar width can reduce the screenshot's content width by 15px.

| Comparison | Reference and rendered evidence | Resolution |
| --- | --- | --- |
| Copy and hierarchy | Workbook name, One note. Three harmonies., key, top-note selector, harmonizations, staff, explanation, fretboard | Same ordering and core copy. Extra bass/inversion explanation, inversion figures and quiet footer documented in spec. |
| Layout / containers | Three outlined harmony rows; open staff/explanation; hairline section dividers | Preserved. Main uses specified 1120px maximum; initial uneven margins corrected to centered layout. |
| Typography | Editorial serif headings, note names and chord labels; sans-serif controls | Georgia/system stack throughout. Controls sized explicitly. Longer diminished names wrap cleanly on 320px screens. |
| Palette | Light ivory, dark ink, teal selected state, orange thirds, purple fifths | Shared tokens and role styles. Role colors corrected relative to each chord root; B is the fifth of E minor. |
| Staff | Single treble chord, soprano callout | Corrected generated concept's incorrect pitches with VexFlow. Real key signatures, ledger lines, font readiness and bass-to-top pitch labels. Fixed inline dimensions and inherited text stroke; callout remains readable on mobile. |
| Fretboard | Six strings, twelve frets, tone markers and role legend | Only actual chord tones highlighted. Root solid, third outlined, fifth dashed with role numbers. String numbers parenthesized to distinguish them from octaves. |
| Mobile | Same workflow stacked, fretboard scroll region | Verified at 390px and 320px. No document overflow; staff scales, note buttons stay together, fretboard scroll remains local. |
| Motion / accessibility | Restrained selection feedback | Native radio groups, focus rings, status descriptions, skip link, labeled SVGs, reduced motion. Hidden skip link no longer appears in full-page screenshot stitching. |

Above-the-fold copy diff: required headline, subtitle, Key, Top note, note names, harmony heading and three choices preserved. Dynamic spelling and role numbers intentionally differ from the generated reference to be musically correct. Content outside that reference is limited to the user's required inversion explanation/figures and workbook footer, recorded in the design spec. No unrelated navigation or features added.

Core workflow verified: C major/G yields C4 E4 G4; selecting iii updates to B3 E4 G4 and second inversion; selecting V updates to B3 D4 G4 and first inversion. Key changes preserve sharp/flat spellings; all 15 keys render exactly one staff SVG and three harmony options without console warnings/errors. C♯/B♯ diminished chord checked at 320px. Both playback buttons enter playing states and return to ready; changing selection disposes previous playback. Physical sound output and Safari hardware behavior were not independently auditioned.

Final comparison: faithfully implements the workbook visual specification with the intentional musical and accessibility corrections above. No unresolved clipping, container, selection-state, or responsive mismatches remain. VexFlow's large embedded-font chunk is a documented build advisory, not a visual failure.

Production smoke check: served `dist/` through Vite preview on port 4173. Confirmed the default three chords, selected V, observed B3–D4–G4 / first inversion, and started arpeggiation with no console errors. Native ArrowLeft from G selected F and regenerated the candidates. ArrowRight in the focused mobile fretboard changed that region's horizontal scroll without overflowing the page. The temporary viewport override was reset and the production preview was left open.
