import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { createCagedPositions } from './caged'
import { STANDARD_TUNING } from './fretboard'
import { createTriadShapesFromTemplates } from './triadShapeTemplates'
import { createTriad } from './triads'

const roots = ['C', 'F#', 'Bb', 'A'] as const
const qualities = ['major', 'minor'] as const
const fretCounts = [0, 12, 18, 22, 35] as const

function fingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 12)
}

describe('CAGED behavior regression', () => {
  it('preserves scale-position order and clipped teaching regions', () => {
    const matrix = roots.flatMap(root => qualities.flatMap(quality => fretCounts.map(fretCount => {
      const positions = createCagedPositions(root, quality, fretCount)
      const placement = positions.map(position => (
        `${position.form}${position.anchorFret}[${position.startFret}-${position.endFret}]`
      )).join(' ')
      return `${root}/${quality}/${fretCount}: ${placement}`
    })))

    expect(matrix.join('\n')).toBe(`C/major/0: C0[0-0]
C/major/12: C0[0-3] A3[2-5] G5[4-8] E8[7-10] D10[9-12] C12[11-12]
C/major/18: C0[0-3] A3[2-5] G5[4-8] E8[7-10] D10[9-13] C12[11-15] A15[14-17] G17[16-18]
C/major/22: C0[0-3] A3[2-5] G5[4-8] E8[7-10] D10[9-13] C12[11-15] A15[14-17] G17[16-20] E20[19-22] D22[21-22]
C/major/35: C0[0-3] A3[2-5] G5[4-8] E8[7-10] D10[9-13] C12[11-15] A15[14-17] G17[16-20] E20[19-22] D22[21-25] C24[23-27] A27[26-29] G29[28-32] E32[31-34] D34[33-35]
C/minor/0: C0[0-0]
C/minor/12: C0[0-3] A3[2-5] G5[4-8] E8[7-10] D10[9-12] C12[11-12]
C/minor/18: C0[0-3] A3[2-5] G5[4-8] E8[7-10] D10[9-13] C12[11-15] A15[14-17] G17[16-18]
C/minor/22: C0[0-3] A3[2-5] G5[4-8] E8[7-10] D10[9-13] C12[11-15] A15[14-17] G17[16-20] E20[19-22] D22[21-22]
C/minor/35: C0[0-3] A3[2-5] G5[4-8] E8[7-10] D10[9-13] C12[11-15] A15[14-17] G17[16-20] E20[19-22] D22[21-25] C24[23-27] A27[26-29] G29[28-32] E32[31-34] D34[33-35]
F#/major/0: 
F#/major/12: E2[1-4] D4[3-7] C6[5-9] A9[8-11] G11[10-12]
F#/major/18: E2[1-4] D4[3-7] C6[5-9] A9[8-11] G11[10-14] E14[13-16] D16[15-18] C18[17-18]
F#/major/22: E2[1-4] D4[3-7] C6[5-9] A9[8-11] G11[10-14] E14[13-16] D16[15-19] C18[17-21] A21[20-22]
F#/major/35: E2[1-4] D4[3-7] C6[5-9] A9[8-11] G11[10-14] E14[13-16] D16[15-19] C18[17-21] A21[20-23] G23[22-26] E26[25-28] D28[27-31] C30[29-33] A33[32-35] G35[34-35]
F#/minor/0: 
F#/minor/12: E2[1-4] D4[3-7] C6[5-9] A9[8-11] G11[10-12]
F#/minor/18: E2[1-4] D4[3-7] C6[5-9] A9[8-11] G11[10-14] E14[13-16] D16[15-18] C18[17-18]
F#/minor/22: E2[1-4] D4[3-7] C6[5-9] A9[8-11] G11[10-14] E14[13-16] D16[15-19] C18[17-21] A21[20-22]
F#/minor/35: E2[1-4] D4[3-7] C6[5-9] A9[8-11] G11[10-14] E14[13-16] D16[15-19] C18[17-21] A21[20-23] G23[22-26] E26[25-28] D28[27-31] C30[29-33] A33[32-35] G35[34-35]
Bb/major/0: 
Bb/major/12: A1[0-3] G3[2-6] E6[5-8] D8[7-11] C10[9-12]
Bb/major/18: A1[0-3] G3[2-6] E6[5-8] D8[7-11] C10[9-13] A13[12-15] G15[14-18] E18[17-18]
Bb/major/22: A1[0-3] G3[2-6] E6[5-8] D8[7-11] C10[9-13] A13[12-15] G15[14-18] E18[17-20] D20[19-22] C22[21-22]
Bb/major/35: A1[0-3] G3[2-6] E6[5-8] D8[7-11] C10[9-13] A13[12-15] G15[14-18] E18[17-20] D20[19-23] C22[21-25] A25[24-27] G27[26-30] E30[29-32] D32[31-35] C34[33-35]
Bb/minor/0: 
Bb/minor/12: A1[0-3] G3[2-6] E6[5-8] D8[7-11] C10[9-12]
Bb/minor/18: A1[0-3] G3[2-6] E6[5-8] D8[7-11] C10[9-13] A13[12-15] G15[14-18] E18[17-18]
Bb/minor/22: A1[0-3] G3[2-6] E6[5-8] D8[7-11] C10[9-13] A13[12-15] G15[14-18] E18[17-20] D20[19-22] C22[21-22]
Bb/minor/35: A1[0-3] G3[2-6] E6[5-8] D8[7-11] C10[9-13] A13[12-15] G15[14-18] E18[17-20] D20[19-23] C22[21-25] A25[24-27] G27[26-30] E30[29-32] D32[31-35] C34[33-35]
A/major/0: A0[0-0]
A/major/12: A0[0-2] G2[1-5] E5[4-7] D7[6-10] C9[8-12] A12[11-12]
A/major/18: A0[0-2] G2[1-5] E5[4-7] D7[6-10] C9[8-12] A12[11-14] G14[13-17] E17[16-18]
A/major/22: A0[0-2] G2[1-5] E5[4-7] D7[6-10] C9[8-12] A12[11-14] G14[13-17] E17[16-19] D19[18-22] C21[20-22]
A/major/35: A0[0-2] G2[1-5] E5[4-7] D7[6-10] C9[8-12] A12[11-14] G14[13-17] E17[16-19] D19[18-22] C21[20-24] A24[23-26] G26[25-29] E29[28-31] D31[30-34] C33[32-35]
A/minor/0: A0[0-0]
A/minor/12: A0[0-2] G2[1-5] E5[4-7] D7[6-10] C9[8-12] A12[11-12]
A/minor/18: A0[0-2] G2[1-5] E5[4-7] D7[6-10] C9[8-12] A12[11-14] G14[13-17] E17[16-18]
A/minor/22: A0[0-2] G2[1-5] E5[4-7] D7[6-10] C9[8-12] A12[11-14] G14[13-17] E17[16-19] D19[18-22] C21[20-22]
A/minor/35: A0[0-2] G2[1-5] E5[4-7] D7[6-10] C9[8-12] A12[11-14] G14[13-17] E17[16-19] D19[18-22] C21[20-24] A24[23-26] G26[25-29] E29[28-31] D31[30-34] C33[32-35]`)
  })

  it('preserves exact scale-position chord tones across roots, qualities, and boundaries', () => {
    const matrix = roots.flatMap(root => qualities.flatMap(quality => fretCounts.map(fretCount => {
      const positions = createCagedPositions(root, quality, fretCount)
      for (const position of positions) {
        for (const tone of position.chordTones) {
          const open = STANDARD_TUNING[STANDARD_TUNING.length - tone.string]
          expect((open.midi + tone.fret) % 12).toBe(tone.pitchClass.chroma)
          expect(tone.fret).toBeGreaterThanOrEqual(0)
          expect(tone.fret).toBeLessThanOrEqual(fretCount)
        }
      }
      const behavior = positions.map(position => ({
        form: position.form,
        anchor: position.anchorFret,
        region: [position.startFret, position.endFret],
        tones: position.chordTones.map(tone => [
          tone.string, tone.fret, tone.role, tone.pitchClass.name,
        ]),
      }))
      return `${root}/${quality}/${fretCount}: ${positions.length}/${fingerprint(behavior)}`
    })))

    expect(matrix.join('\n')).toBe(`C/major/0: 1/fd467fabaa67
C/major/12: 6/9128ff59869c
C/major/18: 8/7ed22b3a33cd
C/major/22: 10/18db046a1839
C/major/35: 15/b61e53a7ae67
C/minor/0: 1/10abbff05ed3
C/minor/12: 6/a5b358ab52b5
C/minor/18: 8/94fcf47d0654
C/minor/22: 10/65cd3a0b8a76
C/minor/35: 15/7e2486728458
F#/major/0: 0/4f53cda18c2b
F#/major/12: 5/3d2fc157a95c
F#/major/18: 8/a02a13fd1946
F#/major/22: 9/ceb4ec618d97
F#/major/35: 15/387155577a6e
F#/minor/0: 0/4f53cda18c2b
F#/minor/12: 5/7e4dedebbd19
F#/minor/18: 8/4c82179806b5
F#/minor/22: 9/f47dc74804ed
F#/minor/35: 15/89c34c99c8b2
Bb/major/0: 0/4f53cda18c2b
Bb/major/12: 5/cc0bd13272ab
Bb/major/18: 8/25e1f14f689a
Bb/major/22: 10/00757d86e431
Bb/major/35: 15/82e01ebc2bc9
Bb/minor/0: 0/4f53cda18c2b
Bb/minor/12: 5/9d536fc13e9c
Bb/minor/18: 8/1bef49f9ef0c
Bb/minor/22: 10/d05ca540ef3d
Bb/minor/35: 15/50ee52128150
A/major/0: 1/6ec8d1a8a04e
A/major/12: 6/28c2d92eae4d
A/major/18: 8/f71f740a1920
A/major/22: 10/fa573be60ae2
A/major/35: 15/17c226953d91
A/minor/0: 1/6ec8d1a8a04e
A/minor/12: 6/42caeeb50829
A/minor/18: 8/49ae12ec6ef3
A/minor/22: 10/fecdcf49344a
A/minor/35: 15/cb33c2446f80`)
  })

  it('preserves triad shape identity, order, geometry, inversions, and CAGED labels', () => {
    const matrix = roots.flatMap(root => qualities.flatMap(quality => (
      ['closed', 'spread'] as const
    ).flatMap(voicing => fretCounts.map(fretCount => {
      const shapes = createTriadShapesFromTemplates(
        createTriad(root, quality),
        voicing,
        { fretCount },
      )
      for (const shape of shapes) {
        expect(shape.notes.every(note => note.fret >= 0 && note.fret <= fretCount)).toBe(true)
        expect(shape.notes.every(note => {
          const open = STANDARD_TUNING[STANDARD_TUNING.length - note.string]
          return (open.midi + note.fret) % 12 === note.tone.pitchClass.chroma
        })).toBe(true)
      }
      const behavior = shapes.map(shape => ({
        id: shape.id,
        template: shape.templateId,
        caged: shape.cagedForms,
        inversion: shape.inversion.index,
        notes: shape.notes.map(note => [
          note.string, note.fret, note.tone.role, note.tone.pitchClass.name,
        ]),
      }))
      return `${root}/${quality}/${voicing}/${fretCount}: ${shapes.length}/${fingerprint(behavior)}`
    }))))

    expect(matrix.join('\n')).toBe(`C/major/closed/0: 0/4f53cda18c2b
C/major/closed/12: 12/b4a3a6ec33c9
C/major/closed/18: 18/1d561f2384da
C/major/closed/22: 23/b9fb1bc7e1db
C/major/closed/35: 35/4d731d5e1cc8
C/major/spread/0: 0/4f53cda18c2b
C/major/spread/12: 9/055b9a0705c7
C/major/spread/18: 12/885435158b83
C/major/spread/22: 16/f25ff3596744
C/major/spread/35: 25/f914fae89e2c
C/minor/closed/0: 0/4f53cda18c2b
C/minor/closed/12: 11/d26d431b1827
C/minor/closed/18: 18/0ab4cec17810
C/minor/closed/22: 22/8d13b01d0fc9
C/minor/closed/35: 35/cd0e7167629b
C/minor/spread/0: 0/4f53cda18c2b
C/minor/spread/12: 9/599e49bc2ee8
C/minor/spread/18: 12/ee5c98d1d24d
C/minor/spread/22: 16/78f3001b2908
C/minor/spread/35: 25/56f0804f5668
F#/major/closed/0: 0/4f53cda18c2b
F#/major/closed/12: 10/adcd7519f848
F#/major/closed/18: 16/24451a6f2c99
F#/major/closed/22: 20/b534b07ea2cf
F#/major/closed/35: 34/ff6c7d1dea0c
F#/major/spread/0: 0/4f53cda18c2b
F#/major/spread/12: 7/88b7865b4f94
F#/major/spread/18: 13/a0ad15620cd9
F#/major/spread/22: 15/2117f454e26d
F#/major/spread/35: 25/73b7fab6edf9
F#/minor/closed/0: 0/4f53cda18c2b
F#/minor/closed/12: 11/2eb63820c559
F#/minor/closed/18: 16/9f4806a56deb
F#/minor/closed/22: 20/00b71caa6fb8
F#/minor/closed/35: 34/85d87ccb202e
F#/minor/spread/0: 0/4f53cda18c2b
F#/minor/spread/12: 7/3a9ad0570c56
F#/minor/spread/18: 13/09ca33110629
F#/minor/spread/22: 15/874711aedf60
F#/minor/spread/35: 25/59728dcac69e
Bb/major/closed/0: 0/4f53cda18c2b
Bb/major/closed/12: 11/b7b21d88c41f
Bb/major/closed/18: 17/2474abfc00a7
Bb/major/closed/22: 21/6984de724b66
Bb/major/closed/35: 34/a4b875977f80
Bb/major/spread/0: 0/4f53cda18c2b
Bb/major/spread/12: 7/d9b1abe51124
Bb/major/spread/18: 12/164b06088416
Bb/major/spread/22: 16/f9553e1bdae3
Bb/major/spread/35: 25/03e28718b91a
Bb/minor/closed/0: 0/4f53cda18c2b
Bb/minor/closed/12: 10/09b58214ecea
Bb/minor/closed/18: 17/449b74ac869d
Bb/minor/closed/22: 20/210cc1e55c99
Bb/minor/closed/35: 34/d4c9adacfb82
Bb/minor/spread/0: 0/4f53cda18c2b
Bb/minor/spread/12: 7/a9e569497983
Bb/minor/spread/18: 12/51c50556d6fe
Bb/minor/spread/22: 16/4752015c1426
Bb/minor/spread/35: 25/7a7498ff29ff
A/major/closed/0: 0/4f53cda18c2b
A/major/closed/12: 12/47ebba13e8d3
A/major/closed/18: 17/63fd80c88aba
A/major/closed/22: 21/fe0d854edba2
A/major/closed/35: 34/2a630ca8a941
A/major/spread/0: 0/4f53cda18c2b
A/major/spread/12: 9/105a9ca5f6d7
A/major/spread/18: 12/4561767a31be
A/major/spread/22: 16/8ea16ea70c8a
A/major/spread/35: 25/b0c0a6bb3661
A/minor/closed/0: 0/4f53cda18c2b
A/minor/closed/12: 12/57294dac1247
A/minor/closed/18: 17/c7b4d3e36b2e
A/minor/closed/22: 22/236a8dc6dd9e
A/minor/closed/35: 34/7ff19e282bd8
A/minor/spread/0: 0/4f53cda18c2b
A/minor/spread/12: 9/7c0aac2f3457
A/minor/spread/18: 12/231e077c39c5
A/minor/spread/22: 16/34b64cd70486
A/minor/spread/35: 25/77167044de29`)
  })

  it('preserves generated playable-shape CAGED associations', () => {
    const associations = qualities.flatMap(quality => (
      ['closed', 'spread'] as const
    ).map(voicing => {
      const shapes = createTriadShapesFromTemplates(
        createTriad('C', quality),
        voicing,
        { fretCount: 35 },
      )
      const byTemplate = new Map(shapes.map(shape => [shape.templateId, shape.cagedForms.join('+')]))
      return `${quality}/${voicing}: ${[...byTemplate].map(([id, forms]) => `${id}=${forms}`).join(' ')}`
    }))

    expect(associations).toEqual([
      'major/closed: closed-123-second=C closed-123-root=A closed-123-first=E closed-234-first=C closed-234-second=A closed-234-root=E closed-345-root=C closed-345-first=G closed-345-second=E closed-456-second=C closed-456-root=G closed-456-first=E',
      'major/spread: spread-245-root=A spread-124-first=C spread-246-second=C spread-356-root=E spread-235-first=G spread-135-second=E spread-124-second=G spread-134-root=D spread-346-first=D',
      'minor/closed: closed-123-root=A closed-123-first=E closed-123-second=D closed-234-first=C closed-234-second=A closed-234-root=E closed-345-root=C closed-345-first=G closed-345-second=E closed-456-second=C closed-456-root=G closed-456-first=E',
      'minor/spread: spread-245-root=A spread-124-first=C spread-246-second=C spread-356-root=E spread-235-first=G spread-135-second=E spread-134-second=G spread-134-root=D spread-346-first=D',
    ])
  })
})
