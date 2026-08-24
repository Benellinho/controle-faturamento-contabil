import { useState } from 'react'
import Icon from '../common/Icon'
import Sidebar from './Sidebar'

function AppLayout({ children, currentPage, onNavigate }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isColdStartNoticeVisible, setIsColdStartNoticeVisible] = useState(true)

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
          <span className="mobile-brand">Lançamentos contábeis</span>
          <span className="demo-badge">DEMO</span>
        </header>
        <main className="app-content">
          {isColdStartNoticeVisible && (
            <div className="alert alert-info alert-dismissible cold-start-notice" role="status">
              <strong>Primeiro acesso pode demorar.</strong>{' '}
              A API pode levar até cerca de 1 minuto para iniciar. Aguarde o carregamento sem atualizar a página.
              <button className="btn-close" type="button" aria-label="Fechar aviso" onClick={() => setIsColdStartNoticeVisible(false)} />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppLayout
