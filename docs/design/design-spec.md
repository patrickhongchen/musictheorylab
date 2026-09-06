# Visual specification

Reference: `concept.png`, generated with the built-in Image Gen tool. Brief: a complete Music Theory Lab workbook screen, large seven-note selector, three selectable harmony rows, open staff/explanation area, playback buttons, six-string fretboard and role legend. No raster assets are shipped in the app.

- Background #faf9f6; ink #252925; muted #656961; line #d9dbd3; selected surface #edf3ef.
- Root #22685b, third #a24b22, fifth #72558e. Pair colors with role names and degree labels.
- Georgia headings and note names; system sans-serif body and controls. Heading 48px desktop / 35px mobile; body 15px; labels 13px; section headings 22px.
- Maximum content width 1120px. Open sections divided by hairlines. Only selectors and harmony choices use borders. Small 5px corner radius, no shadows or gradients.
- Header: Music Theory Lab / An interactive music workbook. Heading: One note. Three harmonies. Subtitle: Keep a note on top. Discover the chords beneath it.
- Sections: Top note; Possible harmonizations; On the staff with inversion explanation; Across the fretboard. Buttons: Play chord / Arpeggiate.
- Selected note filled teal; selected harmony outlined teal. Visible keyboard focus. Short color transitions, reduced-motion support.
- Mobile: seven notes stay together, harmony rows reorganize into tap-friendly options, staff/explanation stack, fretboard scrolls within its own region.

Intentional corrections to the generated reference: render musically correct note placement with VexFlow; color roles relative to each chord root (B is the fifth of E minor); highlight only chord tones on the fretboard; add actual key signature, Roman inversion figures, root/bass/soprano information, accessible labels and diminished-quality handling. These are required by the functional specification.
