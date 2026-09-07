# Blues soloing verification

## Concept fidelity ledger

| Area | Concept evidence | Browser evidence | Result |
| --- | --- | --- | --- |
| First viewport | Editorial heading, compact controls, open 12-bar grid | 1440 × 1536 IAB capture retains the same hierarchy and exposes the change lesson below the grid | Matched |
| Palette | Warm paper, ink, green I, orange IV/third, purple V/seventh | Browser capture uses the same role colors without gradients or shadows | Matched |
| Form anatomy | Three rows of four bars with one selected/playback bar | Twelve accessible buttons; bar 5 selected by default; playback moves the active state | Matched |
| Target lesson | Previous/current chord, home scale, one recommended target, guide-tone paths | A7 → D7 recommends F♯ and displays C♯ → C / G → F♯ | Musically strengthened |
| Staff notation | Not present in the initial concept | Engraved transposing blues scale plus a last-eighth-note approach resolving across the barline; both use the same derived pitches as the lesson | Added at user request |
| Fretboard | Home notes and promoted targets across the neck | Six strings, open position through fret 22, note/degree mode, correct physical markers | Extended beyond concept |
| Practice path | Three numbered exercises | Each Start control changes focus, target lesson, active chord, and status copy | Matched |
| Responsive behavior | Stacked mobile continuation | At 390 × 844 the main width is 335px, two-column form is 335px, and body scroll width is 375px; the fretboard scrolls locally | Matched; no page overflow |

## Intentional improvements over the generated concept

- Use the six-note tonic minor blues scale rather than a five-note pentatonic so the ♭5 passing color is taught explicitly.
- Calculate every transposition and fret marker from the theory model rather than shipping static sample labels.
- Pair both defining guide tones by the shortest available voice leading, rather than showing only one target.
- Simplify blues passing-tone spellings for guitar readability while retaining correct functional spelling in all dominant chords.
- Include accessible descriptions and a live practice/playback status.

## Automated checks

- 191 Vitest tests pass.
- TypeScript strict typecheck passes.
- ESLint passes.
- Production build passes.
