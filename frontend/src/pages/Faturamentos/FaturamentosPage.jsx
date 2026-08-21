import { useEffect, useState } from 'react'
import Icon from '../../components/common/Icon'
import PageHeader from '../../components/layout/PageHeader'
import ListFilters from '../../components/table/ListFilters'
import StatusBadge from '../../components/table/StatusBadge'
import TableEmpty from '../../components/table/TableEmpty'
import { listarCategorias, listarEmpresas } from '../../services/empresasApi'
import { listarLancamentos } from '../../services/lancamentosApi'
import { formatCnpj, formatCurrency, formatPercentage, formatReferenceMonth, formatTaxAmount } from '../../utils/formatters'
import { referenceDateFromMonth } from './faturamentoForm'
import {
  createInitialFilters,
  hasActiveLancamentosFilters,
  updateLancamentosFilter,
} from './faturamentosList'

function FaturamentosPage({ onNavigate }) {
  const [filters, setFilters] = useState(createInitialFilters)
  const [empresas, setEmpresas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [lancamentos, setLancamentos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingEmpresas, setIsLoadingEmpresas] = useState(true)
  const [isLoadingCategorias, setIsLoadingCategorias] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [empresasError, setEmpresasError] = useState('')
  const [categoriasError, setCategoriasError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const hasActiveFilters = hasActiveLancamentosFilters(filters)
  const catalogError = empresasError || categoriasError

  useEffect(() => {
    const controller = new AbortController()

    listarEmpresas({ signal: controller.signal })
      .then((data) => {
        setEmpresas(data)
        setEmpresasError('')
      })
      .catch((error) => {
        if (!controller.signal.aborted) setEmpresasError(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingEmpresas(false)
      })

    return () => controller.abort()
  }, [reloadKey])

  useEffect(() => {
    const controller = new AbortController()

    if (!filters.empresa_id) {
      return () => controller.abort()
    }

    listarCategorias(filters.empresa_id, { signal: controller.signal })
      .then((data) => {
        setCategorias(data)
        setCategoriasError('')
      })
      .catch((error) => {
        if (!controller.signal.aborted) setCategoriasError(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingCategorias(false)
      })

    return () => controller.abort()
  }, [filters.empresa_id, reloadKey])

  useEffect(() => {
    const controller = new AbortController()

    listarLancamentos(filters, { signal: controller.signal })
      .then((data) => {
        setLancamentos(data)
        setErrorMessage('')
      })
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
    if (field === 'empresa_id') {
      setCategorias([])
      setCategoriasError('')
      setIsLoadingCategorias(Boolean(value))
    }
    setFilters((current) => updateLancamentosFilter(current, field, value))
  }

  function clearFilters() {
    setIsLoading(true)
    setErrorMessage('')
    setCategorias([])
    setCategoriasError('')
    setIsLoadingCategorias(false)
    setFilters(createInitialFilters())
  }

  function retryLoading() {
    setIsLoading(true)
    setIsLoadingEmpresas(true)
    setIsLoadingCategorias(Boolean(filters.empresa_id))
    setErrorMessage('')
    setEmpresasError('')
    setCategoriasError('')
    setReloadKey((value) => value + 1)
  }

  function openDetails(id) {
    onNavigate('faturamento-detalhes', id)
  }

  return (
    <div className="list-page">
      <PageHeader
        action={<button className="btn btn-primary" type="button" onClick={() => onNavigate('novo-faturamento', null, { empresaId: filters.empresa_id })}>Lançar categorias <Icon name="arrow" size={17} /></button>}
        title="Lançamentos"
        description="Consulte os lançamentos ativos e substituídos."
      />

      {(catalogError || errorMessage) && (
        <div className="alert alert-danger" role="alert">
          <span>{errorMessage || catalogError}</span>{' '}
          <button className="btn btn-link alert-link p-0" type="button" onClick={retryLoading}>Tentar novamente</button>
        </div>
      )}

      <ListFilters hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
        <div className="col-12 col-lg-3">
          <label className="form-label" htmlFor="fat-empresa">Empresa</label>
          <select className="form-select" disabled={isLoadingEmpresas} id="fat-empresa" onChange={(event) => updateFilter('empresa_id', event.target.value)} value={filters.empresa_id}>
            <option value="">{isLoadingEmpresas ? 'Carregando empresas...' : 'Todas as empresas'}</option>
            {empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome} — {formatCnpj(empresa.cnpj)}</option>)}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <label className="form-label" htmlFor="fat-categoria">Categoria</label>
          <select className="form-select" disabled={!filters.empresa_id || isLoadingCategorias} id="fat-categoria" onChange={(event) => updateFilter('categoria_id', event.target.value)} value={filters.categoria_id}>
            <option value="">{isLoadingCategorias ? 'Carregando categorias...' : filters.empresa_id ? 'Todas' : 'Selecione uma empresa'}</option>
            {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <label className="form-label" htmlFor="fat-data">Mês</label>
          <input className="form-control" id="fat-data" onChange={(event) => updateFilter('data', referenceDateFromMonth(event.target.value))} type="month" value={filters.data.slice(0, 7)} />
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
                <thead><tr><th scope="col">Competência</th><th scope="col">Empresa</th><th scope="col">Categoria</th><th className="text-end" scope="col">Valor</th><th scope="col">Status</th><th className="text-end" scope="col">Ações</th></tr></thead>
                <tbody>{lancamentos.map((item) => <tr className={`navigable-row ${item.status === 'SUBSTITUIDO' ? 'substituted-row' : ''}`} key={item.id} onClick={() => openDetails(item.id)}><td className="text-nowrap">{formatReferenceMonth(item.data_referencia)}</td><td className="cell-main">{item.empresa.nome}<small className="d-block text-body-secondary">{formatCnpj(item.empresa.cnpj)}</small></td><td>{item.categoria.nome}</td><td className="text-end text-nowrap">{formatCurrency(item.valor)}<small className="d-block text-body-secondary">{formatPercentage(item.percentual_imposto)} · {formatTaxAmount(item.valor, item.percentual_imposto)}</small></td><td><StatusBadge status={item.status} /></td><td className="text-end"><button aria-label={`Visualizar lançamento ${item.id} de ${item.empresa.nome}`} className="btn btn-link btn-table-action" type="button" onClick={(event) => { event.stopPropagation(); openDetails(item.id) }}>Visualizar</button></td></tr>)}</tbody>
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
