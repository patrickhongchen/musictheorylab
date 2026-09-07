import { useEffect, type ComponentType } from 'react'
import { AppShell } from './components/AppShell'
import { requestedLab, type LabPage } from './navigation'
import { TriadExplorer } from './views/TriadExplorer'
import { ProgressionBuilder } from './views/ProgressionBuilder'
import { ScaleExplorer } from './views/ScaleExplorer'
import { SoloingExplorer } from './views/SoloingExplorer'

const LAB_VIEWS = {
  explorer: TriadExplorer,
  progression: ProgressionBuilder,
  scales: ScaleExplorer,
  blues: SoloingExplorer,
} satisfies Record<LabPage, ComponentType>

export default function App() {
  const lab = requestedLab(window.location.search)
  const View = LAB_VIEWS[lab.id]
  useEffect(() => {
    document.title = `${lab.title} · Music Theory Lab`
  }, [lab.title])
  return <AppShell page={lab.id}><View /></AppShell>
}
