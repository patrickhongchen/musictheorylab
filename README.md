# Music Theory Lab

A client-side music workbook for seeing and hearing how harmony works. The first lab is an **Interactive Diatonic Triad Explorer**: choose a major key and a top note, then compare the three diatonic triads that contain it.

## Run locally

Use **Node 24 LTS** (Node 22.12+ is also supported).

```sh
npm install
npm run dev
```

Open the local address printed by Vite. No environment variables, API keys, accounts, or server services are needed.

```sh
npm test             # Vitest unit tests
npm run test:watch   # Watch music-engine tests
npm run typecheck    # Strict TypeScript checking
npm run lint         # ESLint, TypeScript and React Hooks rules
npm run build        # Typecheck and produce dist/
npm run preview      # Serve the production build locally
```

Deploy the contents of `dist/` to any static host. Relative asset paths support hosting under a subdirectory. The production app bundles its notation fonts and synthesizes sound locally; it needs no font CDN or sample server. Serve it through HTTP(S), rather than opening `index.html` through `file://`.

## Current features

- All 15 conventional major key signatures: C♭ through C♯, including both sharp and flat enharmonic choices.
- Seven large, keyboard-accessible top-note choices. Default: **C major, G on top**.
- Seven triads generated from the scale, filtered to the three containing the selected pitch class.
- Ascending close-position voicings with one occurrence of each chord tone and a shared soprano register.
- Chord name, Roman numeral, chord-tone roles, bass, soprano, inversion and inversion figures.
- A responsive VexFlow treble staff with key signature, ledger lines, colored noteheads and a labeled soprano.
- Six-string SVG fretboard, standard E2–A2–D3–G3–B3–E4 tuning, frets 0–15, all available chord-tone locations.
- Progression Builder with one harmony choice per ascending scale top note, a complete seven-chord staff, step-by-step fretboard inspection, and an all-progression map with string filters.
- Pentatonic Scale Map with major/minor modes, an ascending staff, note-name and degree labels, a five-tone overview, and a 22-fret map that distinguishes tonic-triad tones from the other scale colors.
- Blues Soloing Lab with a playable 12-bar form, tonic minor-blues home base, dominant chord-tone and guide-tone targets, synchronized scale/change notation with melodic playback, a complete 22-fret map, and progressive practice focuses.
- Root/third/fifth colors paired with numbers and solid/outlined/dashed markers. The numbers describe chord roles, including the diminished fifth of vii°.
- Tone.js chord and ascending arpeggio playback using the exact staff pitches.
- Mobile stacking, comfortable tap targets, native radio keyboard navigation, focus states, screen-reader descriptions, reduced-motion support, and local fretboard scrolling.

Changing key retains the selected scale degree and chord degree where possible, so transposition is easy to compare. Changing top note selects the tonic chord when available, otherwise the first matching degree. Selecting a different harmony stops the previous audio resources so the sound does not continue describing an obsolete selection.

The fretboard shows **available chord tones, not a single playable guitar shape**. The staff and audio show the actual three-note voicing. Guitar string 1 (high E) is drawn at the top; parenthesized numbers identify strings, not octaves.

## Architecture

```text
Key + selected scale degree
            |
            v
src/music — pure TypeScript + Tonal
  scale -> stacked thirds -> triads -> filter -> close voicings
            |
            v
TriadExplorer — selection state + derived TriadResult
            |
     +------+----------------+----------------+
     |                       |                |
     v                       v                v
StaffView              createFretboard    AudioControls
VexFlow SVG            -> FretboardView   -> VoicingPlayer
                             SVG             Tone.js
```

**The music engine has no React, DOM, VexFlow or Tone.js dependency.** Views consume normalized domain objects. Components never independently detect qualities, invert chords, respell notes, calculate pitches, or search frets.

| File / directory | Responsibility |
| --- | --- |
| `src/music/types.ts` | Key, scale, pitch class, octave-qualified pitch, chord tone, triad, voicing, inversion and fretboard types |
| `src/music/scales.ts` | Conventional key choices and Tonal scale generation |
| `src/music/triads.ts` | Stack scale degrees 1–3–5 and identify quality from Tonal's interval dictionary |
| `src/music/romanNumerals.ts` | Degree numerals, quality-dependent case and diminished/augmented marks |
| `src/music/pitches.ts` | Validated spelled pitches, MIDI, frequencies and enharmonic octave handling |
| `src/music/voicings.ts` | Top-note filtering, common register, close position and bass-derived inversion |
| `src/music/fretboard.ts` | Every matching string/fret location, retaining chord spelling and role |
| `src/views/TriadExplorer.tsx` | Selection state and synchronization of every representation |
| `src/components/` | Controls, selectable harmony rows, staff, fretboard, role display and audio controls |
| `src/audio/player.ts` | User-gesture audio start, synth lifetime and chord/arpeggio scheduling |
| `src/presentation/notes.ts` | Display-only accidental glyphs and shared role styling |

`PitchClass` retains both spelling (e.g. C♭) and chroma (11). `Pitch` adds scientific pitch, octave, MIDI and frequency. `Triad` stores root-position chord membership and roles; `Voicing` stores actual ascending pitches, bass, soprano and inversion. Separating chord identity from voicing leaves room for different voicing strategies later.

The register policy places the soprano between E4 and E♭5. Lower pitch classes wrap into the next octave to keep the bass legible in treble clef. All candidates share the exact same soprano pitch. Enharmonic octave boundaries remain correct: B♯3 sounds as C4, while C♭4 sounds as B3. Audio uses the engine's frequencies, avoiding a second note-spelling interpretation.

For each triad, place every tone at its nearest occurrence at or below the soprano, then sort by MIDI. This creates a complete close-position triad spanning less than an octave. Determine inversion by matching its bass to the chord's root, third or fifth—not by the soprano's role.

## Acceptance case and tests

For C major with G on top:

| Degree | Chord | Staff and audio | Bass | Inversion |
| --- | --- | --- | --- | --- |
| I | C major | C4 E4 G4 | C4 | Root position |
| iii | E minor | B3 E4 G4 | B3 | Second inversion |
| V | G major | B3 D4 G4 | B3 | First inversion |

`src/music/engine.test.ts` has **145 passing tests** covering this exact example, independent expected memberships for every scale degree in all 15 keys, interval quality, ascending/complete/close voicings, bass-derived inversion, complete seven-step progressions, grouped progression-map positions, D/E♭/G♭ transposition examples, F♯/G♭/C♯/C♭ spelling, B♯/C♭ octave boundaries, invalid input, and complete fretboard occurrence mapping from the open strings through fret 15.

Browser verification used connected Chrome at desktop, 390px and 320px widths. Key and chord changes, diminished chords, playback controls, single-SVG cleanup across all keys, and local fretboard overflow were checked. This is responsive browser testing, not physical iPhone/Safari testing; speaker output was not recorded or independently auditioned.

## Stack and compatibility decisions

Versions were verified against npm metadata and upstream APIs before installation; `package-lock.json` pins the dependency tree.

| Package | Version | Decision |
| --- | --- | --- |
| React / React DOM | 19.2.8 | Small functional components and derived selection state |
| Vite | 8.2.2 | Static client build with React plugin 6.1.1 |
| TypeScript | 6.0.3 | Latest checked compatible 6.0 release; TypeScript 7.0.2 was outside typescript-eslint 8.69.0's supported `<6.1` range |
| Tonal | 6.4.3 | Primary theory library; [scale/note API](https://tonaljs.github.io/tonal/docs) and [chord dictionary](https://tonaljs.github.io/tonal/docs/dictionaries/chord-types) |
| VexFlow | 5.0.0 | [Typed SVG API](https://github.com/vexflow/vexflow), `vexflow/bravura` entry with embedded fonts; waits for font readiness and replaces SVG on changes |
| Tone.js | 15.1.22 | [PolySynth/start/scheduling API](https://tonejs.github.io/); quiet triangle synth and explicit disposal |
| Vitest | 5.0.0 | Fast Node-based pure-engine tests |
| ESLint | 10.10.0 | Flat configuration with TypeScript and React Hooks rules |

**Fretboard decision:** evaluated [`@moonwave99/fretboard.js`](https://github.com/moonwave99/fretboard.js) 0.2.13. It does ship TypeScript declarations, so it was not rejected for lacking types. Its latest published metadata is from November 2022; it depends on D3 selection 1.x and older separate Tonal 4.x packages. Its imperative rendering and duplicated theory dependencies offer little benefit for this small visualization and would constrain React-owned interaction. The SVG implementation therefore follows the requested fallback, behind `FretboardView({ model, chordName })`; it can be replaced without changing the engine or selection state.

Staff and audio adapters are separate lazy chunks. VexFlow's embedded font/engraving chunk triggers Vite's advisory 500kB chunk warning (about 388kB gzip). The production build succeeds; retaining local fonts keeps the app self-contained. Further font/bundle optimization is deferred.

## Design and future work

The [visual specification](docs/design/design-spec.md) and [verification ledger](docs/design/verification.md) document the workbook design and intentional musical corrections to the generated concept. Final [desktop](docs/design/desktop.png) and [mobile](docs/design/mobile.png) captures are included.

Only major-key triads are implemented. Future labs can add minor keys/modes, intervals, sevenths and extensions, open voicings, SATB and voice leading, cadences, secondary dominants, borrowed chords, scales, individual guitar shapes, a piano keyboard, progressions, quizzes, ear training, saved exercises and spaced repetition. None of their UI or infrastructure has been prematurely added.

Potential next steps: physical iPhone/Safari audio validation, richer inversion comparisons, and the next independent theory concept. There is no backend, authentication, database, persistence or deployment service in this project.
