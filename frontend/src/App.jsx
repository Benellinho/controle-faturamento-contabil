import { useEffect, useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import ControleFaturamentoPage from './pages/ControleFaturamento/ControleFaturamentoPage'
import FaturamentoDetails from './pages/Faturamentos/FaturamentoDetails'
import FaturamentosPage from './pages/Faturamentos/FaturamentosPage'
import NovoFaturamento from './pages/Faturamentos/NovoFaturamento'
import SubstituirFaturamento from './pages/Faturamentos/SubstituirFaturamento'
import { navigationFromPath, pathForNavigation } from './routing'

const pages = {
  faturamentos: FaturamentosPage,
  'controle-anual': ControleFaturamentoPage,
  'faturamento-detalhes': FaturamentoDetails,
  'novo-faturamento': NovoFaturamento,
  'substituir-faturamento': SubstituirFaturamento,
}

const sidebarSection = {
  'faturamento-detalhes': 'faturamentos',
  'substituir-faturamento': 'faturamentos',
}

function App() {
  const [navigation, setNavigation] = useState(() => ({
    ...navigationFromPath(window.location.pathname),
    empresaId: window.history.state?.empresaId ?? null,
  }))
  const CurrentPage = pages[navigation.page]

  useEffect(() => {
    const initialNavigation = navigationFromPath(window.location.pathname)
    const canonicalPath = pathForNavigation(initialNavigation.page, initialNavigation.recordId)
    if (window.location.pathname !== canonicalPath) window.history.replaceState(null, '', canonicalPath)

    function handleHistoryNavigation(event) {
      const nextNavigation = navigationFromPath(window.location.pathname)
      const nextCanonicalPath = pathForNavigation(nextNavigation.page, nextNavigation.recordId)
      if (window.location.pathname !== nextCanonicalPath) window.history.replaceState(null, '', nextCanonicalPath)
      setNavigation({ ...nextNavigation, empresaId: event.state?.empresaId ?? null })
    }

    window.addEventListener('popstate', handleHistoryNavigation)
    return () => window.removeEventListener('popstate', handleHistoryNavigation)
  }, [])

  function handleNavigate(page, recordId = null, options = {}) {
    const path = pathForNavigation(page, recordId)
    if (!pages[page] || !path) return

    const empresaId = Number(options.empresaId)
    const state = page === 'novo-faturamento' && Number.isSafeInteger(empresaId) && empresaId > 0
      ? { empresaId }
      : null

    if (window.location.pathname !== path) {
      window.history.pushState(state, '', path)
    } else {
      window.history.replaceState(state, '', path)
    }
    setNavigation({ ...navigationFromPath(path), empresaId: state?.empresaId ?? null })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeSidebarPage = sidebarSection[navigation.page] ?? navigation.page

  return (
    <AppLayout currentPage={activeSidebarPage} onNavigate={handleNavigate}>
      <CurrentPage initialEmpresaId={navigation.empresaId} key={`${navigation.page}-${navigation.recordId ?? 'novo'}`} onNavigate={handleNavigate} recordId={navigation.recordId} />
    </AppLayout>
  )
}

export default App
