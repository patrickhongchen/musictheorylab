import type { ReactNode } from 'react'
import { LABS, type LabPage } from '../navigation'

export function AppShell({ page, children }: { page: LabPage; children: ReactNode }) {
  return <>
    <a className="skip-link" href="#main">Skip to main content</a>
    <header className="site-header">
      <a className="brand" href="?lab=explorer">Music Theory Lab</a>
      <nav className="lab-nav" aria-label="Music labs">
        {LABS.map(lab => <a key={lab.id} href={`?lab=${lab.id}`} aria-current={page === lab.id ? 'page' : undefined}>{lab.label}</a>)}
      </nav>
    </header>
    <main id="main">{children}</main>
  </>
}
