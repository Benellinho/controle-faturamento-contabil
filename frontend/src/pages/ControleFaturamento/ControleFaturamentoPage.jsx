import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import ListFilters from '../../components/table/ListFilters'
import TableEmpty from '../../components/table/TableEmpty'
import { listarEmpresas } from '../../services/empresasApi'
import { listarLancamentos } from '../../services/lancamentosApi'
import { formatCnpj, formatCurrency, formatPercentage } from '../../utils/formatters'
import { buildAnnualReport, createYearOptions, currentYear, monthName } from './controleAnual'

function ControleFaturamentoPage() {
  const [filters, setFilters] = useState({ empresa_id: '', ano: String(currentYear()) })
  const [empresas, setEmpresas] = useState([])
  const [lancamentos, setLancamentos] = useState([])
  const [isLoadingEmpresas, setIsLoadingEmpresas] = useState(true)
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const yearOptions = useMemo(() => createYearOptions(), [])
  const report = useMemo(() => buildAnnualReport(lancamentos), [lancamentos])
  const selectedEmpresa = empresas.find((item) => item.id === Number(filters.empresa_id))

  useEffect(() => {
    const controller = new AbortController()

    listarEmpresas({ signal: controller.signal })
      .then((data) => {
        setEmpresas(data)
        setErrorMessage('')
      })
      .catch((error) => {
        if (!controller.signal.aborted) setErrorMessage(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingEmpresas(false)
      })

    return () => controller.abort()
  }, [reloadKey])

  useEffect(() => {
    const controller = new AbortController()

    if (!filters.empresa_id || !filters.ano) {
      return () => controller.abort()
    }

    listarLancamentos({ ...filters, status: 'ATIVO' }, { signal: controller.signal })
      .then((data) => setLancamentos(data))
      .catch((error) => {
        if (!controller.signal.aborted) setErrorMessage(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingReport(false)
      })

    return () => controller.abort()
  }, [filters, reloadKey])

  function updateFilter(field, value) {
    const nextEmpresaId = field === 'empresa_id' ? value : filters.empresa_id
    const nextAno = field === 'ano' ? value : filters.ano
    setIsLoadingReport(Boolean(nextEmpresaId && nextAno))
    setErrorMessage('')
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function clearFilters() {
    setFilters({ empresa_id: '', ano: String(currentYear()) })
    setLancamentos([])
    setIsLoadingReport(false)
  }

  function retryLoading() {
    setIsLoadingEmpresas(true)
    setIsLoadingReport(Boolean(filters.empresa_id && filters.ano))
    setErrorMessage('')
    setReloadKey((value) => value + 1)
  }

  return (
    <div className="list-page">
      <PageHeader title="Controle anual" description="Consulte a receita mensal por categoria e os impostos da empresa." />

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          <span>{errorMessage}</span>{' '}
          <button className="btn btn-link alert-link p-0" type="button" onClick={retryLoading}>Tentar novamente</button>
        </div>
      )}

      <ListFilters hasActiveFilters={Boolean(filters.empresa_id)} onClear={clearFilters}>
        <div className="col-12 col-lg-8">
          <label className="form-label" htmlFor="controle-empresa">Empresa <span className="required-mark">*</span></label>
          <select className="form-select" disabled={isLoadingEmpresas} id="controle-empresa" onChange={(event) => updateFilter('empresa_id', event.target.value)} value={filters.empresa_id}>
            <option value="">{isLoadingEmpresas ? 'Carregando empresas...' : 'Selecione uma empresa'}</option>
            {empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome} — {formatCnpj(empresa.cnpj)}</option>)}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-lg-4">
          <label className="form-label" htmlFor="controle-ano">Ano <span className="required-mark">*</span></label>
          <select className="form-select" id="controle-ano" onChange={(event) => updateFilter('ano', event.target.value)} value={filters.ano}>
            {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
      </ListFilters>

      {!filters.empresa_id && (
        <section className="control-welcome">
          <div className="empty-state-icon" aria-hidden="true">CF</div>
          <h2>Selecione uma empresa</h2>
          <p>A receita mensal e os impostos serão exibidos para o ano escolhido.</p>
        </section>
      )}

      {filters.empresa_id && (
        <>
          <div className="control-context">
            <div><span>Empresa selecionada</span><strong>{selectedEmpresa?.nome ?? 'Empresa'}</strong></div>
            <strong>{filters.ano}</strong>
          </div>

          {!isLoadingReport && !errorMessage && (
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-4"><article className="control-metric"><span>Receita anual</span><strong>{formatCurrency(report.revenueTotal)}</strong><small>Soma dos lançamentos ativos</small></article></div>
              <div className="col-12 col-md-4"><article className="control-metric"><span>Impostos calculados</span><strong>{formatCurrency(report.taxTotal)}</strong><small>Conforme percentual de cada categoria</small></article></div>
              <div className="col-12 col-md-4"><article className="control-metric"><span>Meses com receita</span><strong>{report.monthsWithRevenue}</strong><small>De 12 meses no ano</small></article></div>
            </div>
          )}

          <section className="table-card" aria-busy={isLoadingReport}>
            <div className="table-card-title"><div><h2>Receita por categoria</h2><p>Valores mensais e impostos correspondentes.</p></div></div>
            {isLoadingReport && <div className="p-4 text-center" role="status"><span className="spinner-border spinner-border-sm" aria-hidden="true" /> Carregando controle anual...</div>}
            {!isLoadingReport && !errorMessage && (
              <>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead><tr><th scope="col">Mês</th><th scope="col">Categoria</th><th className="text-end" scope="col">Receita</th><th className="text-end" scope="col">Imposto</th><th className="text-end" scope="col">Valor do imposto</th></tr></thead>
                    <tbody>{report.rows.map((item, index) => {
                      const showMonth = index === 0 || report.rows[index - 1].month !== item.month
                      return <tr key={item.id}><td className="cell-main">{showMonth ? monthName(item.month) : ''}</td><td>{item.categoria.nome}</td><td className="text-end text-nowrap">{formatCurrency(item.valor)}</td><td className="text-end text-nowrap">{formatPercentage(item.percentual_imposto)}</td><td className="text-end text-nowrap">{formatCurrency(item.taxAmount)}</td></tr>
                    })}</tbody>
                    {report.rows.length > 0 && <tfoot><tr><th colSpan="2" scope="row">Total anual</th><th className="text-end text-nowrap">{formatCurrency(report.revenueTotal)}</th><td /><th className="text-end text-nowrap">{formatCurrency(report.taxTotal)}</th></tr></tfoot>}
                  </table>
                </div>
                {!report.rows.length && <TableEmpty hasFilters noun="resultado" onClear={clearFilters} />}
                <div className="table-footer">Mostrando {report.rows.length} categoria{report.rows.length === 1 ? '' : 's'} em {report.monthsWithRevenue} {report.monthsWithRevenue === 1 ? 'mês' : 'meses'}</div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default ControleFaturamentoPage
