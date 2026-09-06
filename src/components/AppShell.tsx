import type { ReactNode } from 'react'

export type LabPage = 'explorer' | 'progression'

export function AppShell({ page, children }: { page: LabPage; children: ReactNode }) {
  return <>
    <a className="skip-link" href="#main">Skip to main content</a>
    <header className="site-header">
      <a className="brand" href="?lab=explorer">Music Theory Lab</a>
      <nav className="lab-nav" aria-label="Music labs">
        <a href="?lab=explorer" aria-current={page === 'explorer' ? 'page' : undefined}>Explorer</a>
        <a href="?lab=progression" aria-current={page === 'progression' ? 'page' : undefined}>Progression Builder</a>
      </nav>
    </header>
    <main id="main">{children}</main>
  </>
}
