import Icon from '../common/Icon'
import PaletteSwitcher from './PaletteSwitcher'

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'controle', label: 'Controle de faturamento', icon: 'control' },
  { id: 'empresas', label: 'Empresas', icon: 'companies' },
  { id: 'usuarios', label: 'Usuários', icon: 'users' },
  { id: 'faturamentos', label: 'Faturamentos', icon: 'billing' },
  { id: 'categorias', label: 'Categorias', icon: 'categories' },
  { id: 'historico', label: 'Histórico de cancelamentos', icon: 'history' },
]

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
          <span><strong>Controle</strong><small>Faturamento contábil</small></span>
          <button className="sidebar-close d-lg-none" type="button" onClick={onClose} aria-label="Fechar menu"><Icon name="close" size={22} /></button>
        </div>
        <nav className="sidebar-nav">
          <span className="sidebar-label">Menu principal</span>
          {navigation.map((item) => (
            <button
              className={`sidebar-link ${activePage === item.id ? 'active' : ''}`}
              key={item.label}
              onClick={() => handleNavigation(item.id)}
              type="button"
            >
              <Icon name={item.icon} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <PaletteSwitcher />
        <div className="sidebar-user">
          <div className="user-avatar" aria-hidden="true">MB</div>
          <div className="user-details"><strong>Mariana Barros</strong><span>Contadora</span></div>
          <button className="logout-button" type="button" aria-label="Sair"><Icon name="logout" size={19} /></button>
        </div>
      </aside>
      {isOpen && <button className="sidebar-backdrop d-lg-none" type="button" onClick={onClose} aria-label="Fechar menu" />}
    </>
  )
}

export default Sidebar
