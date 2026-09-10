import { useMemo, useRef, useState } from 'react'
import { shapeColor, shapeInspection } from '../components/ChordShapeFretboard'
import { PROGRESSION_STEP_COLORS } from '../components/ProgressionPathView'
import {
  VoiceLeadingAvailableShapes,
  type VoiceLeadingCatalogSection,
  type VoiceLeadingChordVisibilityItem,
} from '../components/VoiceLeadingAvailableShapes'
import {
  VoiceLeadingProgressionControls,
  voiceLeadingQualityLabel,
  type VoiceLeadingPreset,
} from '../components/VoiceLeadingProgressionControls'
import { chordShapeFamilyId, groupChordShapeRepeats, type PlayableChordShape } from '../music/chordShapes'
import { transposePitchClassName } from '../music/pitches'
import {
  collectAvailableInversions,
  createChordChoice,
  createPlayableChordForChoice,
  createPlayableShapesForChord,
  filterShapesByLowestString,
  LOWEST_STRING_OPTIONS,
  updateChordChoice,
  updateChordChoiceAt,
  voicingLabel,
  type ChordChoice,
  type ChordChoiceUpdate,
  type LowestString,
  type VoiceLeadingChoiceQuality,
} from '../music/voiceLeading'
import { displayNote } from '../presentation/notes'

const FRET_COUNT = 22
const progression = (presetId: string, chords: readonly (readonly [string, VoiceLeadingChoiceQuality])[]) => (
  chords.map(([root, quality], index) => createChordChoice(`${presetId}-${index}`, root, quality))
)
const PRESETS: readonly VoiceLeadingPreset[] = [
  { label: 'C → F → G → C', chords: progression('preset-1', [['C', 'major'], ['F', 'major'], ['G', 'major'], ['C', 'major']]) },
  { label: 'C → G → Am → F', chords: progression('preset-2', [['C', 'major'], ['G', 'major'], ['A', 'minor'], ['F', 'major']]) },
  { label: 'Dm → G → C', chords: progression('preset-3', [['D', 'minor'], ['G', 'major'], ['C', 'major']]) },
]

const lowToHighStringOrder = (left: PlayableChordShape, right: PlayableChordShape) => (
  right.notes[0].string - left.notes[0].string
  || Math.min(...left.notes.map(note => note.fret)) - Math.min(...right.notes.map(note => note.fret))
  || Math.max(...left.notes.map(note => note.fret)) - Math.max(...right.notes.map(note => note.fret))
)

export function VoiceLeadingExplorer() {
  const [chords, setChords] = useState<ChordChoice[]>([...PRESETS[0].chords])
  const [transposeAmount, setTransposeAmount] = useState(2)
  const [lowestString, setLowestString] = useState<LowestString>(3)
  const [hiddenChords, setHiddenChords] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [hoveredId, setHoveredId] = useState<string>()
  const nextChordId = useRef(1)

  const progressionChords = useMemo(() => chords.map(createPlayableChordForChoice), [chords])
  const distinct = useMemo(() => [...new Map(progressionChords.map(chord => [chord.id, chord])).values()], [progressionChords])
  const colorIndexByChordId = useMemo(() => new Map(distinct.map((chord, index) => [chord.id, index])), [distinct])
  const generatedSlots = useMemo(() => chords.map((choice, index) => {
    const chord = progressionChords[index]
    const colorIndex = colorIndexByChordId.get(chord.id) ?? 0
    return {
      choice,
      chord,
      shapes: createPlayableShapesForChord(choice, { fretCount: FRET_COUNT }).map(shape => ({ ...shape, colorIndex })),
    }
  }), [chords, colorIndexByChordId, progressionChords])
  const displaySlots = useMemo(() => generatedSlots.map(slot => ({
    ...slot,
    shapes: filterShapesByLowestString(slot.shapes, lowestString),
  })), [generatedSlots, lowestString])
  const allShapes = useMemo(() => [...new Map(
    displaySlots.flatMap(slot => slot.shapes).map(shape => [shape.id, shape]),
  ).values()], [displaySlots])
  const inversionSections = useMemo(() => collectAvailableInversions(
    generatedSlots.map(slot => slot.shapes),
  ), [generatedSlots])
  const catalogSections = useMemo<readonly VoiceLeadingCatalogSection[]>(() => inversionSections.map(inversion => ({
    index: inversion.index,
    name: inversion.name,
    roleOrder: `${['Root', 'Third', 'Fifth', 'Seventh'][inversion.index]} in bass`,
    slots: generatedSlots.filter(slot => (
      !hiddenChords.includes(slot.chord.id)
      && slot.shapes.some(shape => shape.inversion.index === inversion.index)
    )).map(slot => {
      const shapes = (displaySlots.find(candidate => candidate.choice.id === slot.choice.id)?.shapes ?? [])
        .filter(shape => shape.inversion.index === inversion.index)
        .sort(lowToHighStringOrder)
      return {
        id: slot.choice.id,
        name: `${displayNote(slot.choice.root)} ${voiceLeadingQualityLabel(slot.choice.quality)}`,
        voicingLabel: voicingLabel(slot.choice.voicing),
        repeatGroups: groupChordShapeRepeats(shapes),
      }
    }),
  })), [displaySlots, generatedSlots, hiddenChords, inversionSections])
  const chordVisibilityItems = useMemo<readonly VoiceLeadingChordVisibilityItem[]>(() => progressionChords.map((chord, index) => ({
    key: chords[index].id,
    chord,
    color: PROGRESSION_STEP_COLORS[distinct.findIndex(candidate => candidate.id === chord.id) % PROGRESSION_STEP_COLORS.length],
    visible: !hiddenChords.includes(chord.id),
  })), [chords, distinct, hiddenChords, progressionChords])

  const lowestStringLabel = LOWEST_STRING_OPTIONS.find(option => option.value === lowestString)?.label ?? ''
  const selected = selectedIds.flatMap(id => {
    const shape = allShapes.find(candidate => chordShapeFamilyId(candidate) === id)
    return shape ? [shape] : []
  })
  const visibleShapes = allShapes.filter(shape => !hiddenChords.includes(shape.chord.id))
  const allChordsVisible = distinct.every(chord => !hiddenChords.includes(chord.id))
  const hovered = visibleShapes.find(shape => chordShapeFamilyId(shape) === hoveredId)
  const active = hovered ?? selected[selected.length - 1]
  const inspection = active
    ? shapeInspection(active, allShapes.filter(shape => chordShapeFamilyId(shape) === chordShapeFamilyId(active)))
    : undefined
  const presetIndex = PRESETS.findIndex(preset => JSON.stringify(preset.chords) === JSON.stringify(chords))
  const emptyShapesMessage = lowestString === 0
    ? 'No voicings were found in the current progression.'
    : `No voicing available with ${lowestStringLabel} as the lowest string.`
  const emptyInversionMessage = lowestString === 0
    ? 'No shape in this inversion.'
    : `No voicing available with ${lowestStringLabel} as the lowest string.`

  function resetSelection() {
    setSelectedIds([])
    setHoveredId(undefined)
  }

  function toggleShape(shape: PlayableChordShape) {
    const id = chordShapeFamilyId(shape)
    setSelectedIds(current => current.includes(id) ? current.filter(selectedId => selectedId !== id) : [...current, id])
    // A click ends the preview too, so unpinning clears the board without moving the pointer.
    setHoveredId(undefined)
  }

  function updateProgression(next: ChordChoice[]) {
    setChords(next)
    setHiddenChords([])
    resetSelection()
  }

  function updateProgressionChord(id: string, update: ChordChoiceUpdate) {
    updateProgression([...updateChordChoiceAt(chords, id, update)])
  }

  function moveChord(index: number, nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= chords.length) return
    const next = [...chords]
    const [moved] = next.splice(index, 1)
    next.splice(nextIndex, 0, moved)
    updateProgression(next)
  }

  return <>
    <div className="intro progression-intro">
      <div><h1>Explore chord shapes.</h1><p>Choose each chord’s root, type, and voicing independently. Then explore the movement between shapes.</p></div>
    </div>
    <VoiceLeadingProgressionControls
      chords={chords}
      presets={PRESETS}
      presetIndex={presetIndex}
      lowestString={lowestString}
      transposeAmount={transposeAmount}
      onSelectPreset={index => {
        const preset = PRESETS[index]
        if (preset) updateProgression([...preset.chords])
      }}
      onLowestStringChange={nextLowestString => {
        setLowestString(nextLowestString)
        resetSelection()
      }}
      onTransposeAmountChange={setTransposeAmount}
      onTranspose={direction => updateProgression(chords.map(chord => updateChordChoice(chord, {
        root: transposePitchClassName(chord.root, direction * transposeAmount),
      })))}
      onUpdateChord={updateProgressionChord}
      onMoveChord={moveChord}
      onRemoveChord={index => updateProgression(chords.filter((_, slot) => slot !== index))}
      onAddChord={() => updateProgression([...chords, createChordChoice(`added-${nextChordId.current++}`, 'C', 'major')])}
    />
    <VoiceLeadingAvailableShapes
      allShapes={allShapes}
      visibleShapes={visibleShapes}
      selectedShapes={selected}
      hoveredShape={hovered}
      selectedIds={selectedIds}
      hoveredId={hoveredId}
      inspection={inspection}
      inspectionColor={active ? shapeColor(active) : 'var(--line)'}
      chordVisibilityItems={chordVisibilityItems}
      allChordsVisible={allChordsVisible}
      catalogSections={catalogSections}
      emptyShapesMessage={emptyShapesMessage}
      emptyInversionMessage={emptyInversionMessage}
      fretCount={FRET_COUNT}
      onToggleAllChords={() => {
        setHiddenChords(allChordsVisible ? distinct.map(chord => chord.id) : [])
        setHoveredId(undefined)
      }}
      onToggleChord={chordId => {
        setHiddenChords(current => current.includes(chordId) ? current.filter(hidden => hidden !== chordId) : [...current, chordId])
        setHoveredId(undefined)
      }}
      onHoverShape={shape => setHoveredId(shape ? chordShapeFamilyId(shape) : undefined)}
      onToggleShape={toggleShape}
      onClearSelection={resetSelection}
    />
    <footer className="page-footer">Voice Leading<span>Recognize shapes. Find common ground.</span></footer>
  </>
}
