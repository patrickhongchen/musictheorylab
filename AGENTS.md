# Music Theory Lab

Music Theory Lab is an interactive web application for learning and visualizing music theory, with an emphasis on guitar and fretboard concepts.

## Development

Before making changes, inspect `package.json` for the authoritative development, lint, typecheck, and test commands.

Follow the existing component structure and visual design language.

Prefer existing application utilities and components over adding new dependencies.

## Architecture

- Keep music-theory calculations separate from presentation components when practical.
- Reuse the existing fretboard visualization architecture rather than creating parallel implementations.
- Prefer composable data representations for notes, intervals, chords, scales, and fretboard positions.
- Do not introduce a new framework or major dependency for functionality that can reasonably be implemented with the existing stack.

## UI

- Preserve the existing visual language unless the task explicitly requests a redesign.
- Support the existing responsive/mobile behavior.
- When extending an existing visualization, prefer adding controls or modes to the existing component over duplicating the visualization.

## Scope

Implement only the requested feature or refactor.

Do not add speculative music-theory features as part of unrelated work.