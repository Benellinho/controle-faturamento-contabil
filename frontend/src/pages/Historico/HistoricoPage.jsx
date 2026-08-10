import { useMemo, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import ListFilters from '../../components/table/ListFilters'
import TableEmpty from '../../components/table/TableEmpty'
import { empresasAtivas } from '../../mocks/formOptions'
import { cancelamentos } from '../../mocks/listData'
import { formatCompetencia, formatCurrency, formatDateTime } from '../../utils/formatters'

function HistoricoPage({ onNavigate }) {
  const [filters, setFilters] = useState({ empresa: '', competencia: '' })
  const hasActiveFilters = Object.values(filters).some(Boolean)
  const items = useMemo(() => cancelamentos.filter((item) => (!filters.empresa || item.empresa_id === Number(filters.empresa)) && (!filters.competencia || item.competencia === filters.competencia)), [filters])
  function updateFilter(field, value) { setFilters((current) => ({ ...current, [field]: value })) }
  function clearFilters() { setFilters({ empresa: '', competencia: '' }) }

  return (
    <div className="list-page">
      <PageHeader title="Histórico de cancelamentos" description="Consulte lançamentos cancelados e seus respectivos substitutos." />
      <ListFilters hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
        <div className="col-12 col-lg-8"><label className="form-label" htmlFor="hist-empresa">Empresa</label><select className="form-select" id="hist-empresa" onChange={(event) => updateFilter('empresa', event.target.value)} value={filters.empresa}><option value="">Todas as empresas</option>{empresasAtivas.map((item) => <option key={item.id} value={item.id}>{item.razao_social}</option>)}</select></div>
        <div className="col-12 col-lg-4"><label className="form-label" htmlFor="hist-competencia">Competência</label><input className="form-control" id="hist-competencia" onChange={(event) => updateFilter('competencia', event.target.value)} type="month" value={filters.competencia} /></div>
      </ListFilters>
      <section className="table-card">
        <div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th scope="col">Competência</th><th scope="col">Empresa</th><th className="text-end" scope="col">Valor cancelado</th><th scope="col">Motivo</th><th scope="col">Cancelado em</th><th scope="col">Responsável</th><th scope="col">Substituto</th><th className="text-end" scope="col">Ações</th></tr></thead><tbody>{items.map((item) => { const [year, month] = item.competencia.split('-'); return <tr className="cancelled-row" key={item.id}><td>{formatCompetencia(year, month)}</td><td className="cell-main">{empresasAtivas.find((empresa) => empresa.id === item.empresa_id)?.razao_social}</td><td className="text-end text-nowrap">{formatCurrency(item.valor)}</td><td>{item.motivo}</td><td className="text-nowrap">{formatDateTime(item.cancelado_em)}</td><td>{item.usuario}</td><td>#{item.substituto_id}</td><td className="text-end"><button className="btn btn-link btn-table-action" type="button" onClick={() => onNavigate('faturamento-detalhes', item.id)}>Visualizar</button></td></tr> })}</tbody></table></div>
        {!items.length && <TableEmpty hasFilters={hasActiveFilters} noun="cancelamento" onClear={clearFilters} />}
        <div className="table-footer">Mostrando {items.length} de {cancelamentos.length} cancelamentos</div>
      </section>
    </div>
  )
}

export default HistoricoPage
