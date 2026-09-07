# Blues Soloing: chord-scale progression workbench

Desktop concept: `blues-progression-concept-v2.png`

Mobile concept: `blues-progression-mobile-v2.png`

## Product contract

- The user builds an ordered progression of independently editable chord-scale steps.
- Each step owns a chord root, chord quality, scale root, and scale type.
- The selected step drives the staff and fretboard from one shared theory model.
- A `Notes shown` segmented filter switches both visualizers between `Both`, `Chord`, and `Scale` note sets.
- The next-chord toggle overlays only the immediate next chord, wrapping from the last step to the first.
- `Scale` mode removes chord emphasis and temporarily disables the next-chord overlay; returning to `Both` or `Chord` restores the user's overlay preference.
- Chord tones outside the selected scale are shown explicitly whenever chord tones are included.

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
- Selected-scale tone outside the current chord: paper marker with an ink `#252925` outline and ink label.
- Current chord tone: same-size pale-mint `#d8eee7` marker with a heavy green `#176b5b` border and bold ink label on the fretboard; solid green notehead on the staff.
- Chord tone outside the selected scale: amber `#c56a1a` diamond attached to the marker or placed beside the staff degree.
- Next chord: cobalt `#4666b0` dashed outer halo. Shared tones retain their base marker and add the halo.
- Role treatments compose independently so a current/next/outside tone shows the current marker, amber diamond, and blue halo together.
- `Both` shows the union of the selected scale and chord tones, `Chord` limits the display to current plus optionally next chord tones, and `Scale` presents a neutral scale-only map.
- The selected harmony, view controls, and marker key occupy separate horizontal bands so long chord/scale names cannot collide with controls.
- The next-chord control uses a short, persistent `Next chord` label; its switch and accessible name communicate whether the overlay is shown or hidden.
- The marker key uses only the marker symbol and role name visually; treatment details remain in its accessible label.
- On the staff, chord tones outside the scale are inserted at their chromatic pitch position inside the tonic-to-tonic run.
- Staff noteheads and degree labels use the same shared role palette as the fretboard: ink for scale, green for current chord, amber for outside-scale next tones, and blue for the next-chord halo. Pitch-class names stay neutral and omit octave numbers.
- Staff degree and pitch-class labels use the same 16px regular-weight app serif. The numeral and pitch letter share the notehead's center axis; an accidental sits to the numeral's left without shifting that axis.
- Staff annotations reuse the established application hierarchy: a regular Georgia degree above a smaller muted system-sans scientific pitch.
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
