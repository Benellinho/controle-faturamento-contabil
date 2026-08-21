import { useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard/Dashboard'
import CategoriasPage from './pages/Categorias/CategoriasPage'
import NovaCategoria from './pages/Categorias/NovaCategoria'
import ControleFaturamentoPage from './pages/ControleFaturamento/ControleFaturamentoPage'
import EmpresaDetails from './pages/Empresas/EmpresaDetails'
import EmpresasPage from './pages/Empresas/EmpresasPage'
import NovaEmpresa from './pages/Empresas/NovaEmpresa'
import FaturamentoDetails from './pages/Faturamentos/FaturamentoDetails'
import FaturamentosPage from './pages/Faturamentos/FaturamentosPage'
import NovoFaturamento from './pages/Faturamentos/NovoFaturamento'
import SubstituirFaturamento from './pages/Faturamentos/SubstituirFaturamento'
import HistoricoPage from './pages/Historico/HistoricoPage'
import UsuarioDetails from './pages/Usuarios/UsuarioDetails'
import UsuariosPage from './pages/Usuarios/UsuariosPage'
import NovoUsuario from './pages/Usuarios/NovoUsuario'

const pages = {
  dashboard: Dashboard,
  controle: ControleFaturamentoPage,
  empresas: EmpresasPage,
  'empresa-detalhes': EmpresaDetails,
  'nova-empresa': NovaEmpresa,
  usuarios: UsuariosPage,
  'usuario-detalhes': UsuarioDetails,
  'novo-usuario': NovoUsuario,
  faturamentos: FaturamentosPage,
  'faturamento-detalhes': FaturamentoDetails,
  'novo-faturamento': NovoFaturamento,
  'substituir-faturamento': SubstituirFaturamento,
  categorias: CategoriasPage,
  'nova-categoria': NovaCategoria,
  historico: HistoricoPage,
}

const sidebarSection = {
  'nova-empresa': 'empresas',
  'empresa-detalhes': 'empresas',
  'novo-usuario': 'usuarios',
  'usuario-detalhes': 'usuarios',
  'novo-faturamento': 'faturamentos',
  'faturamento-detalhes': 'faturamentos',
  'substituir-faturamento': 'faturamentos',
  'nova-categoria': 'categorias',
}

function App() {
  const [navigation, setNavigation] = useState({ page: 'faturamentos', recordId: null, returnPage: null })
  const CurrentPage = pages[navigation.page]

  function handleNavigate(page, recordId = null) {
    if (!pages[page]) return
    setNavigation((current) => ({
      page,
      recordId,
      returnPage: page.endsWith('-detalhes')
        ? (current.page.endsWith('-detalhes') ? current.returnPage : current.page)
        : null,
    }))
  }

  const activeSidebarPage = navigation.page === 'faturamento-detalhes' && navigation.returnPage === 'controle'
    ? 'controle'
    : sidebarSection[navigation.page] ?? navigation.page

  return (
    <AppLayout currentPage={activeSidebarPage} onNavigate={handleNavigate}>
      <CurrentPage key={`${navigation.page}-${navigation.recordId ?? 'novo'}`} onNavigate={handleNavigate} recordId={navigation.recordId} returnPage={navigation.returnPage} />
    </AppLayout>
  )
}

export default App
