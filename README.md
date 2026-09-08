# Music Theory Lab

A client-side music workbook for exploring harmony, scales, notation, and guitar fretboard patterns. Four labs share a pure TypeScript music engine and a responsive workbook design.

## Run locally

Use Node 24 LTS (see `package.json` for all supported versions).

```sh
npm ci
npm run dev
```

Open the address printed by Vite. No environment variables, API keys, accounts, or server services are needed.

```sh
npm test             # Music-engine and presentation unit tests
npm run test:watch   # Watch tests
npm run typecheck    # Strict TypeScript checking
npm run lint         # ESLint, TypeScript and React Hooks rules
npm run build        # Typecheck and produce dist/
npm run preview      # Serve the production build locally
```

Deploy `dist/` to any static host. Relative asset paths support subdirectory hosting. Notation fonts are bundled and sound is synthesized locally, with no font CDN or sample server. Serve the app through HTTP(S).

## Hosting portability

ChatGPT Sites hosts the application as static files; the application does not depend on Sites services. GitHub remains the canonical source, and Sites receives a deployment mirror of the same source. Run `npm ci` and `npm run build` to produce the standard `dist/` directory for any compatible static host.

The only Sites configuration is `.openai/hosting.json`: `project_id` identifies the hosting destination and `static.directory` selects `dist/`. To migrate, delete that file and publish `dist/` to the new host. No application code, dependencies, environment variables, or build scripts need changing.

## Labs

| Lab | URL | Behavior |
| --- | --- | --- |
| Diatonic Triad Explorer | `?lab=explorer` (default) | Choose one of 15 major key signatures and a top note; compare its three diatonic harmonizations, inversions, notation, and chord or arpeggio playback. |
| Progression Builder | `?lab=progression` | Harmonize seven ascending top notes, inspect the complete staff, and explore chord detail or repeated voicing paths across three-string windows. |
| Pentatonic Scale Map | `?lab=scales` | Explore major/minor pentatonics, ascending notation, and a 22-fret map with note-name or degree labels. |
| Soloing | `?lab=blues` | Add, duplicate, reorder, delete, and transpose progression steps; pair each chord with a scale and compare their tones on the staff and fretboard, including the next chord. |

Soloing retains the original blues URL for existing bookmarks. It supports major, minor, diminished, major-seventh, minor-seventh, and dominant-seventh chords; Ionian, Dorian, Mixolydian, Aeolian, major/minor pentatonic, and blues scales. The Both/Chord/Scale filters and next-chord overlay synchronize notation, fretboard markers, and legends. Playback is currently available in the Triad Explorer.

Changing key in the Triad Explorer retains the selected scale degree and chord degree where possible. Changing top note prefers the tonic chord when available. Changing the selected harmony disposes the previous audio resources. Selections are held in memory and reset on page navigation or reload.

The chord-detail fretboard shows available chord tones, not a single playable guitar shape. Staff and audio show the actual voicing. Guitar string 1 (high E) is drawn at the top; parenthesized numbers identify strings, not octaves.

## Architecture

| Location | Responsibility |
| --- | --- |
| `src/navigation.ts` | Lab identifiers, navigation labels, page titles, and unknown-URL fallback |
| `src/App.tsx`, `src/components/AppShell.tsx` | Select a lab and render shared navigation |
| `src/views/` | Selection state and derived models for each lab |
| `src/music/` | Pure TypeScript + Tonal: pitches, scales, triads, voicings, progression shapes, and chord/scale memberships |
| `src/presentation/` | Display-only accidental glyphs, tone roles, and shared scale colors |
| `src/components/` | Controls, legends, SVG fretboards, and lazy-loaded VexFlow notation adapters |
| `src/components/notation.ts` | Shared font readiness, resize scheduling, renderer cleanup, pitch keys, and SVG annotation helpers |
| `src/audio/player.ts` | User-gesture audio start, synth lifetime, and chord/arpeggio scheduling |
| `src/styles.css` | Shared visual tokens, workbook layout, lab styles, and responsive rules |

The music engine has no React, DOM, VexFlow, or Tone.js dependency. Views derive normalized models, while rendering adapters consume resolved pitches and memberships. `src/music/blues.ts` retains tested twelve-bar blues and guide-tone utilities; the current Soloing UI uses `src/music/soloing.ts`.

`PitchClass` retains spelling and chroma; `Pitch` adds scientific pitch, octave, MIDI, and frequency. `Triad` stores root-position chord membership and roles, while `Voicing` stores actual ascending pitches, bass, soprano, and inversion. Audio uses engine frequencies, preserving enharmonic octave boundaries such as B♯3 = C4 and C♭4 = B3.

Triad voicings place the soprano between E4 and E♭5. Each tone is placed at its nearest occurrence at or below that soprano, producing a complete close-position triad spanning less than an octave. The bass determines inversion.

## Validation

For C major with G on top:

| Degree | Chord | Staff and audio | Inversion |
| --- | --- | --- | --- |
| I | C major | C4 E4 G4 | Root position |
| iii | E minor | B3 E4 G4 | Second inversion |
| V | G major | B3 D4 G4 | First inversion |

Unit tests cover all 15 keys, scale-degree memberships, chord qualities, voicings, inversion, enharmonic octave boundaries, progression shapes, fretboard mapping, blues guide tones, soloing scale/chord classification, and transposition.

For rendering or style changes, also check all four labs at desktop and narrow mobile widths. Exercise key/scale changes, progression editing, display filters, and audio controls. Confirm that each staff contains only one SVG after selection or resize, keyboard focus is visible, and wide fretboards scroll inside their own regions.

The VexFlow Bravura chunk includes embedded notation fonts and exceeds Vite's advisory 500 kB chunk threshold. The production build succeeds; notation and audio remain lazy-loaded. Package versions and the resolved dependency tree are pinned in `package.json` and `package-lock.json`.

## Design

The design uses a warm paper background, serif headings and musical names, system sans-serif controls and explanatory text, and colored markers reinforced by labels and shapes. Shared font tokens keep HTML and SVG annotations consistent without changing VexFlow's music glyphs.

Historical concepts, screenshots, and implementation notes live in [`docs/design/`](docs/design/). They document earlier iterations and are not a specification of the current Soloing interface. There is no application backend, authentication, or persistence.
