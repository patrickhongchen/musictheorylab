export const LABS = [
  { id: 'explorer', label: 'Explorer', title: 'Diatonic Triad Explorer' },
  { id: 'progression', label: 'Progression Builder', title: 'Progression Builder' },
  { id: 'voice-leading', label: 'Voice Leading', title: 'Voice Leading' },
  { id: 'scales', label: 'Scales', title: 'Pentatonic Scale Map' },
  // Preserve existing bookmarks for the original blues lab.
  { id: 'blues', label: 'Soloing', title: 'Soloing' },
] as const

export type LabPage = typeof LABS[number]['id']

export function requestedLab(search: string) {
  const id = new URLSearchParams(search).get('lab')
  return LABS.find(lab => lab.id === id) ?? LABS[0]
}
