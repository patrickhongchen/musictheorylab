import { useEffect } from 'react'
import { AppShell, type LabPage } from './components/AppShell'
import { TriadExplorer } from './views/TriadExplorer'
import { ProgressionBuilder } from './views/ProgressionBuilder'
import { ScaleExplorer } from './views/ScaleExplorer'

export default function App() {
  const requestedPage = new URLSearchParams(window.location.search).get('lab')
  const page: LabPage = requestedPage === 'progression' || requestedPage === 'scales' ? requestedPage : 'explorer'
  useEffect(() => {
    document.title = {
      explorer: 'Diatonic Triad Explorer · Music Theory Lab',
      progression: 'Progression Builder · Music Theory Lab',
      scales: 'Pentatonic Scale Map · Music Theory Lab',
    }[page]
  }, [page])
  return <AppShell page={page}>{page === 'progression'
    ? <ProgressionBuilder />
    : page === 'scales' ? <ScaleExplorer /> : <TriadExplorer />}</AppShell>
}
