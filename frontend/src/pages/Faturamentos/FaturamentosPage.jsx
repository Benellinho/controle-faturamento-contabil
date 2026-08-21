import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import ListFilters from '../../components/table/ListFilters'
import StatusBadge from '../../components/table/StatusBadge'
import TableEmpty from '../../components/table/TableEmpty'
import { listarCategorias, listarEmpresas } from '../../services/empresasApi'
import { listarLancamentos } from '../../services/lancamentosApi'
import { formatCnpj, formatCurrency, formatDate } from '../../utils/formatters'

const initialFilters = {
  empresa_id: '',
  categoria_id: '',
  data: '',
  status: '',
}

function FaturamentosPage({ onNavigate }) {
  const [filters, setFilters] = useState(initialFilters)
  const [empresas, setEmpresas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [lancamentos, setLancamentos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [catalogError, setCatalogError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const hasActiveFilters = Object.values(filters).some(Boolean)

  useEffect(() => {
    const controller = new AbortController()

    listarEmpresas({ signal: controller.signal })
      .then(setEmpresas)
      .catch((error) => {
        if (!controller.signal.aborted) setCatalogError(error.message)
      })

    return () => controller.abort()
  }, [reloadKey])

  useEffect(() => {
    const controller = new AbortController()

    if (!filters.empresa_id) {
      return () => controller.abort()
    }

    listarCategorias(filters.empresa_id, { signal: controller.signal })
      .then(setCategorias)
      .catch((error) => {
        if (!controller.signal.aborted) setCatalogError(error.message)
      })

    return () => controller.abort()
  }, [filters.empresa_id, reloadKey])

  useEffect(() => {
    const controller = new AbortController()

    listarLancamentos(filters, { signal: controller.signal })
      .then(setLancamentos)
      .catch((error) => {
        if (!controller.signal.aborted) setErrorMessage(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [filters, reloadKey])

  function updateFilter(field, value) {
    setIsLoading(true)
    setErrorMessage('')
    if (field === 'empresa_id') setCategorias([])
    setFilters((current) => ({
      ...current,
      [field]: value,
      ...(field === 'empresa_id' ? { categoria_id: '' } : {}),
    }))
  }

  function clearFilters() {
    setIsLoading(true)
    setErrorMessage('')
    setCategorias([])
    setFilters(initialFilters)
  }

  function retryLoading() {
    setIsLoading(true)
    setErrorMessage('')
    setCatalogError('')
    setReloadKey((value) => value + 1)
  }

  return (
    <div className="list-page">
      <PageHeader title="Lançamentos" description="Consulte os lançamentos ativos e substituídos." />

      {(catalogError || errorMessage) && (
        <div className="alert alert-danger" role="alert">
          <span>{errorMessage || catalogError}</span>{' '}
          <button className="btn btn-link alert-link p-0" type="button" onClick={retryLoading}>Tentar novamente</button>
        </div>
      )}

      <ListFilters hasActiveFilters={hasActiveFilters} newLabel="Novo lançamento" onClear={clearFilters} onNew={() => onNavigate('novo-faturamento')}>
        <div className="col-12 col-lg-3">
          <label className="form-label" htmlFor="fat-empresa">Empresa</label>
          <select className="form-select" id="fat-empresa" onChange={(event) => updateFilter('empresa_id', event.target.value)} value={filters.empresa_id}>
            <option value="">Todas as empresas</option>
            {empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome} — {formatCnpj(empresa.cnpj)}</option>)}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <label className="form-label" htmlFor="fat-categoria">Categoria</label>
          <select className="form-select" disabled={!filters.empresa_id} id="fat-categoria" onChange={(event) => updateFilter('categoria_id', event.target.value)} value={filters.categoria_id}>
            <option value="">{filters.empresa_id ? 'Todas' : 'Selecione uma empresa'}</option>
            {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <label className="form-label" htmlFor="fat-data">Data</label>
          <input className="form-control" id="fat-data" onChange={(event) => updateFilter('data', event.target.value)} type="date" value={filters.data} />
        </div>
        <div className="col-12 col-lg-3">
          <label className="form-label" htmlFor="fat-status">Status</label>
          <select className="form-select" id="fat-status" onChange={(event) => updateFilter('status', event.target.value)} value={filters.status}>
            <option value="">Todos</option>
            <option value="ATIVO">Ativos</option>
            <option value="SUBSTITUIDO">Substituídos</option>
          </select>
        </div>
      </ListFilters>

      <section className="table-card" aria-busy={isLoading}>
        {isLoading && (
          <div className="p-4 text-center" role="status">
            <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Carregando lançamentos...
          </div>
        )}

        {!isLoading && !errorMessage && (
          <>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead><tr><th scope="col">Data</th><th scope="col">Empresa</th><th scope="col">Categoria</th><th className="text-end" scope="col">Valor</th><th scope="col">Status</th><th className="text-end" scope="col">Ações</th></tr></thead>
                <tbody>{lancamentos.map((item) => <tr className={item.status === 'SUBSTITUIDO' ? 'cancelled-row' : ''} key={item.id}><td className="text-nowrap">{formatDate(item.data_referencia)}</td><td className="cell-main">{item.empresa.nome}<small className="d-block text-body-secondary">{formatCnpj(item.empresa.cnpj)}</small></td><td>{item.categoria.nome}</td><td className="text-end text-nowrap">{formatCurrency(item.valor)}</td><td><StatusBadge status={item.status} /></td><td className="text-end"><button className="btn btn-link btn-table-action" type="button" onClick={() => onNavigate('faturamento-detalhes', item.id)}>Visualizar</button></td></tr>)}</tbody>
              </table>
            </div>
            {!lancamentos.length && <TableEmpty hasFilters={hasActiveFilters} noun="lançamento" onClear={clearFilters} />}
            <div className="table-footer">Mostrando {lancamentos.length} lançamento{lancamentos.length === 1 ? '' : 's'}</div>
          </>
        )}
      </section>
    </div>
  )
}

export default FaturamentosPage
