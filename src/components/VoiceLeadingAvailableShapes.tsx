import { Fragment, type CSSProperties } from 'react'
import { chordShapeFamilyId, soundingBass, type PlayableChord, type PlayableChordShape } from '../music/chordShapes'
import { fretLabel, shapeCagedLabel, shapeColor, ChordShapeFretboard } from './ChordShapeFretboard'
import { displayNote } from '../presentation/notes'

const STRING_NAMES = ['E', 'B', 'G', 'D', 'A', 'E']

export interface VoiceLeadingChordVisibilityItem {
  readonly key: string
  readonly chord: PlayableChord
  readonly color: string
  readonly visible: boolean
}

export interface VoiceLeadingCatalogSlot {
  readonly id: string
  readonly name: string
  readonly voicingLabel: string
  readonly repeatGroups: readonly (readonly PlayableChordShape[])[]
}

export interface VoiceLeadingCatalogSection {
  readonly index: number
  readonly name: string
  readonly roleOrder: string
  readonly slots: readonly VoiceLeadingCatalogSlot[]
}

export interface VoiceLeadingShapeInspection {
  readonly title: string
  readonly notes: string
  readonly location: string
  readonly cagedLabel: string
}

interface Props {
  allShapes: readonly PlayableChordShape[]
  visibleShapes: readonly PlayableChordShape[]
  selectedShapes: readonly PlayableChordShape[]
  hoveredShape: PlayableChordShape | undefined
  selectedIds: readonly string[]
  hoveredId: string | undefined
  inspection: VoiceLeadingShapeInspection | undefined
  inspectionColor: string
  chordVisibilityItems: readonly VoiceLeadingChordVisibilityItem[]
  allChordsVisible: boolean
  catalogSections: readonly VoiceLeadingCatalogSection[]
  emptyShapesMessage: string
  emptyInversionMessage: string
  fretCount: number
  onToggleAllChords: () => void
  onToggleChord: (chordId: string) => void
  onHoverShape: (shape: PlayableChordShape | undefined) => void
  onToggleShape: (shape: PlayableChordShape) => void
  onClearSelection: () => void
}

export function VoiceLeadingAvailableShapes({
  allShapes,
  visibleShapes,
  selectedShapes,
  hoveredShape,
  selectedIds,
  hoveredId,
  inspection,
  inspectionColor,
  chordVisibilityItems,
  allChordsVisible,
  catalogSections,
  emptyShapesMessage,
  emptyInversionMessage,
  fretCount,
  onToggleAllChords,
  onToggleChord,
  onHoverShape,
  onToggleShape,
  onClearSelection,
}: Props) {
  return <section className="voice-leading-map" aria-labelledby="voice-map-heading">
    <div className="section-heading"><h2 id="voice-map-heading">Available shapes</h2><span>{visibleShapes.length} fretboard positions · frets 0–22</span></div>
    <div className="voice-chord-strip" role="group" aria-label="Chord visibility">
      <button type="button" aria-pressed={allChordsVisible} onClick={onToggleAllChords}>All chords</button>
      {chordVisibilityItems.map((item, index) => <Fragment key={item.key}>
        {index > 0 && <span aria-hidden="true">→</span>}
        <button type="button" aria-pressed={item.visible} style={{ '--shape-color': item.color } as CSSProperties} onClick={() => onToggleChord(item.chord.id)}>
          <strong>{displayNote(item.chord.root.name)}</strong><small>{item.chord.quality === 'major7' ? 'Major 7' : item.chord.quality}</small>
        </button>
      </Fragment>)}
    </div>
    <p className="voice-map-help">Colors identify chords without repeating chord names across the fretboard. Hover or select a shape to reveal its actual notes and intervals. Click shapes or cards to pin several; click again to unpin. Pinned shapes stay on the board; dotted rings mark the same string and fret in another chord.</p>
    <div className="voice-selection" role="status">
      <div className="voice-inspection" style={{ '--shape-color': inspectionColor } as CSSProperties}>
        <div className="voice-inspection-heading">
          <strong>{inspection?.title ?? 'Hover or select a shape to inspect it.'}</strong>
          {inspection && <span className="voice-inspection-notes">{inspection.notes}</span>}
        </div>
        <div className="voice-inspection-location"><span>{inspection?.location}</span></div>
        <div className="voice-inspection-form">{inspection?.cagedLabel}</div>
        <small>{selectedShapes.length > 0 ? `${selectedShapes.length} pinned ${selectedShapes.length === 1 ? 'shape' : 'shapes'}` : ''}</small>
      </div>
      <button type="button" onClick={onClearSelection} style={{ visibility: selectedShapes.length > 0 ? 'visible' : 'hidden' }} disabled={selectedShapes.length === 0}>Clear all selections</button>
    </div>
    {allShapes.length === 0
      ? <p className="voice-map-help">{emptyShapesMessage}</p>
      : visibleShapes.length === 0 && <p className="voice-map-help">No chords enabled. Toggle a chord above or choose All chords.{selectedShapes.length > 0 ? ' Your pinned shapes are still shown.' : ''}</p>}
    <ChordShapeFretboard allShapes={allShapes} shapes={visibleShapes} selected={selectedShapes} hovered={hoveredShape} fretCount={fretCount} onHover={onHoverShape} onSelect={onToggleShape} />
    <div className="fretboard-caption">
      <p>Per-chord voicings · skipped strings are muted · standard tuning</p>
      <p>Inversion and lowest-string filtering follow the actual sounding bass.</p>
    </div>
    <div className="voice-shape-catalog voice-shape-grid" style={{ '--inversion-columns': catalogSections.length } as CSSProperties} aria-label="Select any available shape">
      {catalogSections.map(section => <section className="voice-inversion-group" key={section.index} aria-labelledby={`catalog-inversion-${section.index}`}>
        <header><h3 id={`catalog-inversion-${section.index}`}>{section.name}</h3><small>{section.roleOrder}</small></header>
        {section.slots.map(slot => <details key={slot.id} open>
          <summary>{slot.name} · {slot.voicingLabel}</summary>
          <div className="voice-inversion-list">{slot.repeatGroups.length === 0
            ? <p className="voice-inversion-empty">{emptyInversionMessage}</p>
            : slot.repeatGroups.map(repeats => {
              const shape = repeats[0]
              const bass = soundingBass(shape)
              const familyId = chordShapeFamilyId(shape)
              return <button key={shape.id} type="button"
                data-hovered={hoveredId === familyId ? 'true' : undefined}
                style={{ '--shape-color': shapeColor(shape) } as CSSProperties} aria-pressed={selectedIds.includes(familyId)}
                onMouseEnter={() => onHoverShape(shape)} onMouseLeave={() => onHoverShape(undefined)}
                onFocus={() => onHoverShape(shape)} onBlur={() => onHoverShape(undefined)}
                onClick={() => onToggleShape(shape)}>
                <strong>{STRING_NAMES[bass.string - 1]} ({bass.string}): {repeats.map(repeat => fretLabel(soundingBass(repeat).fret)).join(' / ')}</strong>
                <small>{shapeCagedLabel(shape) || 'Major 7 voicing'}</small>
              </button>
            })}</div>
        </details>)}
      </section>)}
    </div>
  </section>
}
