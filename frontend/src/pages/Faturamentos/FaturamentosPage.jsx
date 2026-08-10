import { useMemo, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import ListFilters from '../../components/table/ListFilters'
import StatusBadge from '../../components/table/StatusBadge'
import TableEmpty from '../../components/table/TableEmpty'
import { categoriasAtivas, empresasAtivas } from '../../mocks/formOptions'
import { faturamentos } from '../../mocks/listData'
import { formatCompetencia, formatCurrency } from '../../utils/formatters'

function FaturamentosPage({ onNavigate }) {
  const [filters, setFilters] = useState({ empresa: '', competencia: '', categoria: '', status: '' })
  const hasActiveFilters = Object.values(filters).some(Boolean)
  const filteredItems = useMemo(() => faturamentos.filter((item) => (
    (!filters.empresa || item.empresa_id === Number(filters.empresa)) &&
    (!filters.competencia || item.competencia === filters.competencia) &&
    (!filters.categoria || item.categoria_id === Number(filters.categoria)) &&
    (!filters.status || item.status === filters.status)
  )), [filters])

  function updateFilter(field, value) { setFilters((current) => ({ ...current, [field]: value })) }
  function clearFilters() { setFilters({ empresa: '', competencia: '', categoria: '', status: '' }) }
  function empresaName(id) { return empresasAtivas.find((item) => item.id === id)?.razao_social ?? 'Empresa não encontrada' }
  function categoriaName(id) { return categoriasAtivas.find((item) => item.id === id)?.nome ?? 'Categoria inativa' }
  function competenciaLabel(value) { const [year, month] = value.split('-'); return formatCompetencia(year, month) }

  return (
    <div className="list-page">
      <PageHeader title="Faturamentos" description="Consulte os lançamentos mensais ativos e cancelados." />
      <ListFilters hasActiveFilters={hasActiveFilters} newLabel="Novo lançamento" onClear={clearFilters} onNew={() => onNavigate('novo-faturamento')}>
        <div className="col-12 col-lg-4"><label className="form-label" htmlFor="fat-empresa">Empresa</label><select className="form-select" id="fat-empresa" onChange={(event) => updateFilter('empresa', event.target.value)} value={filters.empresa}><option value="">Todas as empresas</option>{empresasAtivas.map((item) => <option key={item.id} value={item.id}>{item.razao_social}</option>)}</select></div>
        <div className="col-12 col-sm-6 col-lg-3"><label className="form-label" htmlFor="fat-competencia">Competência</label><input className="form-control" id="fat-competencia" onChange={(event) => updateFilter('competencia', event.target.value)} type="month" value={filters.competencia} /></div>
        <div className="col-12 col-sm-6 col-lg-3"><label className="form-label" htmlFor="fat-categoria">Categoria</label><select className="form-select" id="fat-categoria" onChange={(event) => updateFilter('categoria', event.target.value)} value={filters.categoria}><option value="">Todas</option>{categoriasAtivas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></div>
        <div className="col-12 col-lg-2"><label className="form-label" htmlFor="fat-status">Status</label><select className="form-select" id="fat-status" onChange={(event) => updateFilter('status', event.target.value)} value={filters.status}><option value="">Todos</option><option value="ATIVO">Ativos</option><option value="CANCELADO">Cancelados</option></select></div>
      </ListFilters>
      <section className="table-card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead><tr><th scope="col">Competência</th><th scope="col">Empresa</th><th scope="col">Categoria</th><th className="text-end" scope="col">Valor</th><th scope="col">Status</th><th className="text-end" scope="col">Ações</th></tr></thead>
            <tbody>{filteredItems.map((item) => <tr className={item.status === 'CANCELADO' ? 'cancelled-row' : ''} key={item.id}><td className="text-nowrap">{competenciaLabel(item.competencia)}</td><td className="cell-main">{empresaName(item.empresa_id)}</td><td>{categoriaName(item.categoria_id)}</td><td className="text-end text-nowrap">{formatCurrency(item.valor)}</td><td><StatusBadge status={item.status} /></td><td className="text-end"><button className="btn btn-link btn-table-action" type="button" onClick={() => onNavigate('faturamento-detalhes', item.id)}>Visualizar</button></td></tr>)}</tbody>
          </table>
        </div>
        {!filteredItems.length && <TableEmpty hasFilters={hasActiveFilters} noun="faturamento" onClear={clearFilters} />}
        <div className="table-footer">Mostrando {filteredItems.length} de {faturamentos.length} faturamentos</div>
      </section>
    </div>
  )
}

export default FaturamentosPage
