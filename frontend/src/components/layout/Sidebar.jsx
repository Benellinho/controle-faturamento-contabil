import Icon from '../common/Icon'
import PaletteSwitcher from './PaletteSwitcher'
import { p0Navigation } from './p0Navigation'

function Sidebar({ activePage, isOpen, onClose, onNavigate }) {
  function handleNavigation(page) {
    onNavigate(page)
    onClose()
  }

  return (
    <>
      <aside className={`app-sidebar ${isOpen ? 'is-open' : ''}`} aria-label="Navegação principal">
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">CF</span>
          <span><strong>Controle</strong><small>Lançamentos contábeis</small></span>
          <button className="sidebar-close d-lg-none" type="button" onClick={onClose} aria-label="Fechar menu"><Icon name="close" size={22} /></button>
        </div>
        <nav className="sidebar-nav">
          <span className="sidebar-label">Menu principal</span>
          {p0Navigation.map((item) => (
            <button
              className={`sidebar-link ${activePage === item.id ? 'active' : ''}`}
              aria-current={activePage === item.id ? 'page' : undefined}
              key={item.label}
              onClick={() => handleNavigation(item.id)}
              type="button"
            >
              <Icon name={item.icon} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <PaletteSwitcher />
        <div className="sidebar-scope">
          <strong>Protótipo P0</strong>
          <span>Empresas e categorias são pré-cadastradas.</span>
        </div>
      </aside>
      {isOpen && <button className="sidebar-backdrop d-lg-none" type="button" onClick={onClose} aria-label="Fechar menu" />}
    </>
  )
}

export default Sidebar
