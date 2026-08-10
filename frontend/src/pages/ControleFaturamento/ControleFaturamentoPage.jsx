import { useMemo, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import ListFilters from '../../components/table/ListFilters'
import StatusBadge from '../../components/table/StatusBadge'
import TableEmpty from '../../components/table/TableEmpty'
import { categorias, empresas, faturamentos } from '../../mocks/listData'
import { formatCompetencia, formatCurrency, formatDate } from '../../utils/formatters'

function signedValue(item) {
  if (item.status !== 'ATIVO') return 0
  return item.tipo === 'DEVOLUCAO_ESTORNO' ? -item.valor : item.valor
}

function competenciaLabel(value) {
  const [year, month] = value.split('-')
  return formatCompetencia(year, month)
}

function ControleFaturamentoPage({ onNavigate }) {
  const [filters, setFilters] = useState({ empresa: '', inicio: '', fim: '' })
  const selectedEmpresa = empresas.find((item) => item.id === Number(filters.empresa))
  const hasActiveFilters = Boolean(filters.empresa || filters.inicio || filters.fim)

  const controlData = useMemo(() => {
    if (!filters.empresa) return null

    const companyItems = faturamentos
      .filter((item) => item.empresa_id === Number(filters.empresa))
      .sort((a, b) => a.competencia.localeCompare(b.competencia) || a.id - b.id)
    const periodItems = companyItems.filter((item) => (
      (!filters.inicio || item.competencia >= filters.inicio) &&
      (!filters.fim || item.competencia <= filters.fim)
    ))
    const activePeriodItems = periodItems.filter((item) => item.status === 'ATIVO')
    const cumulativeByCompetencia = new Map()
    let runningTotal = 0

    companyItems
      .filter((item) => item.status === 'ATIVO')
      .forEach((item) => {
        runningTotal += signedValue(item)
        cumulativeByCompetencia.set(item.competencia, runningTotal)
      })

    const accumulatedItems = companyItems.filter((item) => (
      item.status === 'ATIVO' && (!filters.fim || item.competencia <= filters.fim)
    ))
    const firstActive = activePeriodItems.at(0)
    const lastActive = activePeriodItems.at(-1)

    return {
      items: periodItems,
      cumulativeByCompetencia,
      accumulatedTotal: accumulatedItems.reduce((total, item) => total + signedValue(item), 0),
      initialStock: firstActive?.estoque_inicial ?? null,
      finalStock: lastActive?.estoque_final ?? null,
      competencies: new Set(activePeriodItems.map((item) => item.competencia)).size,
    }
  }, [filters])

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function clearFilters() {
    setFilters({ empresa: '', inicio: '', fim: '' })
  }

  function categoriaName(id) {
    return categorias.find((item) => item.id === id)?.nome ?? '—'
  }

  return (
    <div className="list-page">
      <PageHeader title="Controle de faturamento" description="Selecione uma empresa para acompanhar os lançamentos, o acumulado e a movimentação dos estoques." />

      <ListFilters hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
        <div className="col-12 col-lg-6">
          <label className="form-label" htmlFor="controle-empresa">Empresa <span className="required-mark">*</span></label>
          <select className="form-select" id="controle-empresa" onChange={(event) => updateFilter('empresa', event.target.value)} value={filters.empresa}>
            <option value="">Selecione uma empresa</option>
            {empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.razao_social}</option>)}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <label className="form-label" htmlFor="controle-inicio">Competência inicial</label>
          <input className="form-control" id="controle-inicio" max={filters.fim || undefined} onChange={(event) => updateFilter('inicio', event.target.value)} type="month" value={filters.inicio} />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <label className="form-label" htmlFor="controle-fim">Competência final</label>
          <input className="form-control" id="controle-fim" min={filters.inicio || undefined} onChange={(event) => updateFilter('fim', event.target.value)} type="month" value={filters.fim} />
        </div>
      </ListFilters>

      {!selectedEmpresa && (
        <section className="control-welcome">
          <div className="empty-state-icon" aria-hidden="true">CF</div>
          <h2>Selecione uma empresa</h2>
          <p>Os indicadores e lançamentos serão carregados depois que uma empresa for selecionada.</p>
        </section>
      )}

      {selectedEmpresa && controlData && (
        <>
          <div className="control-context">
            <div><span>Empresa selecionada</span><strong>{selectedEmpresa.razao_social}</strong></div>
            <StatusBadge status={selectedEmpresa.ativa ? 'ATIVA' : 'INATIVA'} />
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3"><article className="control-metric"><span>Faturamento acumulado</span><strong>{formatCurrency(controlData.accumulatedTotal)}</strong><small>Até a competência final</small></article></div>
            <div className="col-12 col-sm-6 col-xl-3"><article className="control-metric"><span>Estoque inicial do período</span><strong>{controlData.initialStock === null ? '—' : formatCurrency(controlData.initialStock)}</strong><small>Primeiro lançamento ativo</small></article></div>
            <div className="col-12 col-sm-6 col-xl-3"><article className="control-metric"><span>Estoque final do período</span><strong>{controlData.finalStock === null ? '—' : formatCurrency(controlData.finalStock)}</strong><small>Último lançamento ativo</small></article></div>
            <div className="col-12 col-sm-6 col-xl-3"><article className="control-metric"><span>Competências no período</span><strong>{controlData.competencies}</strong><small>Com lançamento ativo</small></article></div>
          </div>

          <div className="domain-note" role="note">
            O modelo atual não possui notas fiscais separadas. Esta consulta apresenta os lançamentos mensais cadastrados em cada competência.
          </div>

          <section className="table-card">
            <div className="table-card-title"><div><h2>Lançamentos do período</h2><p>Registros ativos e cancelados permanecem disponíveis para consulta.</p></div></div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead><tr><th scope="col">Competência</th><th scope="col">Referência</th><th scope="col">Categoria</th><th scope="col">Tipo</th><th className="text-end" scope="col">Valor</th><th className="text-end" scope="col">Acumulado</th><th className="text-end" scope="col">Estoque inicial</th><th className="text-end" scope="col">Estoque final</th><th scope="col">Status</th><th className="text-end" scope="col">Ações</th></tr></thead>
                <tbody>{controlData.items.map((item) => <tr className={item.status === 'CANCELADO' ? 'cancelled-row' : ''} key={item.id}><td>{competenciaLabel(item.competencia)}</td><td>{formatDate(item.data_referencia)}</td><td className="cell-main">{categoriaName(item.categoria_id)}</td><td>{item.tipo === 'FATURAMENTO' ? 'Faturamento' : 'Devolução / estorno'}</td><td className="text-end text-nowrap">{formatCurrency(item.valor)}</td><td className="text-end text-nowrap">{item.status === 'ATIVO' ? formatCurrency(controlData.cumulativeByCompetencia.get(item.competencia)) : '—'}</td><td className="text-end text-nowrap">{formatCurrency(item.estoque_inicial)}</td><td className="text-end text-nowrap">{formatCurrency(item.estoque_final)}</td><td><StatusBadge status={item.status} /></td><td className="text-end"><button className="btn btn-link btn-table-action" type="button" onClick={() => onNavigate('faturamento-detalhes', item.id)}>Visualizar</button></td></tr>)}</tbody>
              </table>
            </div>
            {!controlData.items.length && <TableEmpty hasFilters={Boolean(filters.inicio || filters.fim)} noun="lançamento" onClear={() => setFilters((current) => ({ ...current, inicio: '', fim: '' }))} />}
            <div className="table-footer">Mostrando {controlData.items.length} lançamentos</div>
          </section>
        </>
      )}
    </div>
  )
}

export default ControleFaturamentoPage
