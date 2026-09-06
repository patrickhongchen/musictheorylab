import { useEffect } from 'react'
import { AppShell, type LabPage } from './components/AppShell'
import { TriadExplorer } from './views/TriadExplorer'
import { ProgressionBuilder } from './views/ProgressionBuilder'

export default function App() {
  const page: LabPage = new URLSearchParams(window.location.search).get('lab') === 'progression' ? 'progression' : 'explorer'
  useEffect(() => {
    document.title = page === 'progression' ? 'Progression Builder · Music Theory Lab' : 'Diatonic Triad Explorer · Music Theory Lab'
  }, [page])
  return <AppShell page={page}>{page === 'progression' ? <ProgressionBuilder /> : <TriadExplorer />}</AppShell>
}
