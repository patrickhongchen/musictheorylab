export type SoloingNoteFilter = 'both' | 'chord' | 'scale'

/** Shared palette for every chord-scale visualization. */
export const SOLOING_VISUAL_COLORS = {
  scale: '#252925',
  current: '#176b5b',
  currentFill: '#d8eee7',
  outside: '#c56a1a',
  next: '#4666b0',
  paper: '#faf9f6',
  muted: '#656961',
} as const
