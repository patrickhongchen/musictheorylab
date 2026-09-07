# Blues Soloing: chord-scale progression workbench

Desktop concept: `blues-progression-concept-v2.png`

Mobile concept: `blues-progression-mobile-v2.png`

## Product contract

- The user builds an ordered progression of independently editable chord-scale steps.
- Each step owns a chord root, chord quality, scale root, and scale type.
- The selected step drives the staff and fretboard from one shared theory model.
- The next-chord toggle overlays only the immediate next chord, wrapping from the last step to the first.
- Chord tones outside the selected scale are always shown explicitly.

## Visible copy and order

1. `Solo over any progression.`
2. `Build the changes, choose a scale for each chord, and see both under your fingers.`
3. `Your progression`
4. `Edit selected chord`
5. `Selected sound`
6. `On the staff`
7. `Across the fretboard`
8. `Blues Soloing Lab`

## Visual system

- Background: warm paper `#faf9f6`.
- Text: ink `#252925`, muted `#656961`.
- Lines: `#d9dbd3` with stronger section rules where hierarchy needs them.
- Selected-scale tone outside the current chord: paper fill with an ink `#252925` outline and ink label.
- Current chord tone inside the scale: solid green `#22685b`.
- Current chord tone outside the selected scale: solid green `#22685b` with an orange outer ring.
- Next chord: orange outline; shared current/next tone: green fill with an orange outer ring.
- Display type uses Georgia; UI controls use the system sans-serif stack.
- Open rails and bands are preferred to nested cards. Controls retain 5px radii and at least 44px touch targets.

## Responsive contract

- Desktop uses the existing 1120px content container.
- The progression becomes a locally scrollable rail before its steps become unreadable.
- At narrow widths, editor fields form a two-column grid and then a one-column stack.
- Staff and fretboard remain focusable local scroll regions; the document itself never scrolls horizontally.
- Step actions use labeled, keyboard-accessible buttons rather than drag-only reordering.

## Concept interpretation

The generated concepts define composition, hierarchy, spacing, controls, and marker treatment. Tonal and VexFlow remain authoritative for pitches, spellings, degrees, and fret positions; any inaccurate notation rendered in the concept is intentionally corrected in the implementation.
