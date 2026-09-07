# Blues soloing module plan

Reference concept: `blues-soloing-concept.png`, generated with the built-in Image Gen tool.

## Learning outcome

Move a guitarist from “one pentatonic box for the whole tune” to hearing and landing on the I7, IV7, and V7 changes. The first lesson deliberately keeps one home vocabulary—tonic minor blues—then adds only the notes needed to state each dominant chord clearly.

## Teaching sequence

1. Learn the common turnaround form: I I I I / IV IV I I / V IV I V.
2. Use the tonic minor blues scale as connective vocabulary, including the ♭5 as a passing color.
3. Target the root on beat 1 to prove the learner can follow the form.
4. Target the 3rd and ♭7 of each dominant chord; show the closest guide-tone movement at every change.
5. Approach a target from the nearest blues-scale tone, then resolve.
6. Later modules can add call-and-response phrasing, a quick-IV variant, major-blues color, and chromatic enclosures.

This order follows the chord-tone-before-chord-scale emphasis in [Berklee Online's Basic Improvisation syllabus](https://online.berklee.edu/courses/basic-improvisation), the guide-tone voice-leading described in [Open Music Theory's Blues Harmony](https://viva.pressbooks.pub/openmusictheory/chapter/blues-harmony/), and its treatment of blues-scale melodic tension in [Blues Melodies and the Blues Scale](https://viva.pressbooks.pub/openmusictheory/chapter/blues-melodies-and-the-blues-scale/).

## Product plan

- Add `?lab=blues` and a Blues Soloing navigation item.
- Keep the theory engine pure: build dominant chords, the 12-bar form, guide-tone connections, approach notes, and fret positions in `src/music/blues.ts`.
- Synchronize key, selected/playing bar, focus mode, lesson copy, chord-tone table, notation, and fretboard in one React view.
- Provide local synthesized playback for one chorus at 60, 72, or 88 bpm.
- Keep the visual system consistent with the existing workbook: warm paper, editorial serif, open sections, hairline rules, and green/orange/purple role colors.
- Verify practical flat-key spelling, form logic, voice leading, staff registers, fretboard coordinates, keyboard semantics, responsive reflow, and local scrolling.

## Shipped first slice

- Twelve common blues keys, default A.
- Common turnaround form with selectable and playback-driven bar state.
- Root, guide-tone, and approach-note focus modes.
- Dominant chord-tone map for I7, IV7, and V7.
- An engraved home-scale staff plus a two-measure lead-in/target example that follows the active change, with separate “Hear scale” and “Hear target” playback.
- One continuous open-string-to-fret-22 map with note/degree labels.
- Three progressively constrained practice exercises.
