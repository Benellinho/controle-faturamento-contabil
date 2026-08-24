import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import ListFilters from '../../components/table/ListFilters'
import TableEmpty from '../../components/table/TableEmpty'
import { listarCategorias, listarEmpresas } from '../../services/empresasApi'
import { listarLancamentos } from '../../services/lancamentosApi'
import { formatCnpj, formatCurrency, formatPercentage } from '../../utils/formatters'
import { buildAnnualReport, createYearOptions, currentYear, monthName } from './controleAnual'

function formatTaxPercentages(entry) {
  return entry?.taxPercentages.map(formatPercentage).join(' / ') || '—'
}

function RevenueCell({ entry }) {
  return <td className="text-center text-nowrap">{formatCurrency(entry?.value ?? 0)}</td>
}

function TaxCell({ entry }) {
  if (!entry?.taxPercentages.length) return <td className="text-center">—</td>

  return (
    <td className="text-center text-nowrap">
      {formatTaxPercentages(entry)}
      <small className="d-block text-body-secondary">{formatCurrency(entry.taxAmount)}</small>
    </td>
  )
}

function ControleFaturamentoPage() {
  const [filters, setFilters] = useState({ empresa_id: '', ano: String(currentYear()) })
  const [empresas, setEmpresas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [lancamentos, setLancamentos] = useState([])
  const [isLoadingEmpresas, setIsLoadingEmpresas] = useState(true)
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const yearOptions = useMemo(() => createYearOptions(), [])
  const report = useMemo(() => buildAnnualReport(lancamentos, categorias), [lancamentos, categorias])
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

    Promise.all([
      listarCategorias(filters.empresa_id, { signal: controller.signal }),
      listarLancamentos({ ...filters, status: 'ATIVO' }, { signal: controller.signal }),
    ])
      .then(([categoryData, entryData]) => {
        setCategorias(categoryData)
        setLancamentos(entryData)
      })
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
    setCategorias([])
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

          <section className="table-card" aria-busy={isLoadingReport}>
            <div className="table-card-title"><div><h2>Receita mensal por categoria</h2><p>Valores normais, com RT, acumulados e impostos correspondentes.</p></div></div>
            {isLoadingReport && <div className="p-4 text-center" role="status"><span className="spinner-border spinner-border-sm" aria-hidden="true" /> Carregando controle anual...</div>}
            {!isLoadingReport && !errorMessage && (
              <>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 control-annual-table">
                    <thead><tr><th className="text-center" scope="col">Mês</th>{report.categories.flatMap((category) => [<th className="text-center" key={`${category.key}-normal`} scope="col">{category.nome}</th>, <th className="text-center" key={`${category.key}-rt`} scope="col">{category.nome} com RT</th>])}<th className="text-center" scope="col">Acum. (mês)</th><th className="text-center" scope="col">Acum. (ano)</th>{report.categories.flatMap((category) => [<th className="text-center" key={`${category.key}-tax-normal`} scope="col">% {category.nome}</th>, <th className="text-center" key={`${category.key}-tax-rt`} scope="col">% {category.nome} com RT</th>])}<th className="text-center" scope="col">Valor impostos</th></tr></thead>
                    <tbody>{report.rows.map((row) => (
                      <tr key={row.month}>
                        <td className="cell-main text-center">{monthName(row.month)}</td>
                        {report.categories.flatMap((category) => [<RevenueCell entry={row.categories[category.key]?.NORMAL} key={`${category.key}-normal`} />, <RevenueCell entry={row.categories[category.key]?.COM_RT} key={`${category.key}-rt`} />])}
                        <td className="text-center text-nowrap">{formatCurrency(row.monthTotal)}</td>
                        <td className="text-center text-nowrap">{formatCurrency(row.yearAccumulated)}</td>
                        {report.categories.flatMap((category) => [<TaxCell entry={row.categories[category.key]?.NORMAL} key={`${category.key}-tax-normal`} />, <TaxCell entry={row.categories[category.key]?.COM_RT} key={`${category.key}-tax-rt`} />])}
                        <td className="text-center text-nowrap">{formatCurrency(row.taxTotal)}</td>
                      </tr>
                    ))}</tbody>
                    {report.rows.length > 0 && <tfoot><tr><th className="text-center" scope="row">Total anual</th>{report.categories.flatMap((category) => [<th className="text-center text-nowrap" key={`${category.key}-normal`}>{formatCurrency(report.categoryTotals[category.key].NORMAL.value)}</th>, <th className="text-center text-nowrap" key={`${category.key}-rt`}>{formatCurrency(report.categoryTotals[category.key].COM_RT.value)}</th>])}<th className="text-center text-nowrap">{formatCurrency(report.revenueTotal)}</th><th className="text-center text-nowrap">{formatCurrency(report.revenueTotal)}</th>{report.categories.flatMap((category) => [<th className="text-center text-nowrap" key={`${category.key}-tax-normal`}>{formatCurrency(report.categoryTotals[category.key].NORMAL.taxAmount)}</th>, <th className="text-center text-nowrap" key={`${category.key}-tax-rt`}>{formatCurrency(report.categoryTotals[category.key].COM_RT.taxAmount)}</th>])}<th className="text-center text-nowrap">{formatCurrency(report.taxTotal)}</th></tr></tfoot>}
                  </table>
                </div>
                {!report.rows.length && <TableEmpty hasFilters noun="resultado" onClear={clearFilters} />}
                <div className="table-footer">Mostrando {report.categories.length} categoria{report.categories.length === 1 ? '' : 's'} em {report.monthsWithRevenue} {report.monthsWithRevenue === 1 ? 'mês' : 'meses'}</div>
              </>
            )}
          </section>

          {!isLoadingReport && !errorMessage && (
            <div className="row g-3 mt-1">
              <div className="col-12 col-md-4"><article className="control-metric"><span>Receita anual</span><strong>{formatCurrency(report.revenueTotal)}</strong><small>Soma dos lançamentos ativos</small></article></div>
              <div className="col-12 col-md-4"><article className="control-metric"><span>Impostos calculados</span><strong>{formatCurrency(report.taxTotal)}</strong><small>Conforme percentual de cada categoria</small></article></div>
              <div className="col-12 col-md-4"><article className="control-metric"><span>Meses com receita</span><strong>{report.monthsWithRevenue}</strong><small>De 12 meses no ano</small></article></div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ControleFaturamentoPage
