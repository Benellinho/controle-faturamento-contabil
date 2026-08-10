import { useMemo, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import ListFilters from '../../components/table/ListFilters'
import StatusBadge from '../../components/table/StatusBadge'
import TableEmpty from '../../components/table/TableEmpty'
import { empresas } from '../../mocks/listData'
import { formatCnpj } from '../../utils/formatters'

function EmpresasPage({ onNavigate }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('todas')
  const hasActiveFilters = Boolean(search || status !== 'todas')
  const filteredItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR').replace(/\D/g, '') || search.trim().toLocaleLowerCase('pt-BR')
    return empresas.filter((empresa) => {
      const textMatch = !term || empresa.razao_social.toLocaleLowerCase('pt-BR').includes(term) || empresa.nome_fantasia.toLocaleLowerCase('pt-BR').includes(term) || empresa.cnpj.includes(term)
      const statusMatch = status === 'todas' || (status === 'ativas' ? empresa.ativa : !empresa.ativa)
      return textMatch && statusMatch
    })
  }, [search, status])

  function clearFilters() { setSearch(''); setStatus('todas') }

  return (
    <div className="list-page">
      <PageHeader title="Empresas" description="Gerencie as empresas cadastradas e consulte sua situação atual." />
      <ListFilters hasActiveFilters={hasActiveFilters} newLabel="Nova empresa" onClear={clearFilters} onNew={() => onNavigate('nova-empresa')}>
        <div className="col-12 col-lg-8">
          <label className="form-label" htmlFor="empresas-search">Buscar</label>
          <input className="form-control" id="empresas-search" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por razão social, nome fantasia ou CNPJ..." value={search} />
        </div>
        <div className="col-12 col-lg-4">
          <label className="form-label" htmlFor="empresas-status">Situação</label>
          <select className="form-select" id="empresas-status" onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="todas">Todas</option><option value="ativas">Ativas</option><option value="inativas">Inativas</option>
          </select>
        </div>
      </ListFilters>
      <section className="table-card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead><tr><th scope="col">CNPJ</th><th scope="col">Razão social</th><th scope="col">Nome fantasia</th><th scope="col">Situação</th><th className="text-end" scope="col">Ações</th></tr></thead>
            <tbody>
              {filteredItems.map((empresa) => <tr key={empresa.id}><td className="text-nowrap">{formatCnpj(empresa.cnpj)}</td><td className="cell-main">{empresa.razao_social}</td><td>{empresa.nome_fantasia}</td><td><StatusBadge status={empresa.ativa ? 'ATIVA' : 'INATIVA'} /></td><td className="text-end"><button className="btn btn-link btn-table-action" type="button" onClick={() => onNavigate('empresa-detalhes', empresa.id)}>Visualizar</button></td></tr>)}
            </tbody>
          </table>
        </div>
        {!filteredItems.length && <TableEmpty hasFilters={hasActiveFilters} noun="empresa" onClear={clearFilters} />}
        <div className="table-footer">Mostrando {filteredItems.length} de {empresas.length} empresas</div>
      </section>
    </div>
  )
}

export default EmpresasPage
