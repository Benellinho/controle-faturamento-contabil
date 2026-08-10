import { useState } from 'react'
import Icon from '../common/Icon'
import Sidebar from './Sidebar'

function AppLayout({ children, currentPage, onNavigate }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar
        activePage={currentPage}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={onNavigate}
      />
      <div className="app-main">
        <header className="mobile-header d-lg-none">
          <button className="menu-button" type="button" onClick={() => setIsSidebarOpen(true)} aria-label="Abrir menu" aria-expanded={isSidebarOpen}><Icon name="menu" size={23} /></button>
          <span className="mobile-brand">Controle de Faturamento</span>
          <span className="demo-badge">DEMO</span>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  )
}

export default AppLayout
