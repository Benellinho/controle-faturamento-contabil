import { useMemo, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import ListFilters from '../../components/table/ListFilters'
import StatusBadge from '../../components/table/StatusBadge'
import TableEmpty from '../../components/table/TableEmpty'
import { categorias } from '../../mocks/listData'
import CategoriaDetailsModal from './components/CategoriaDetailsModal'

function CategoriasPage({ onNavigate }) {
  const [search, setSearch] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState(null)
  const term = search.trim().toLocaleLowerCase('pt-BR')
  const items = useMemo(() => categorias.filter((item) => !term || item.nome.toLocaleLowerCase('pt-BR').includes(term)), [term])

  return (
    <div className="list-page">
      <PageHeader title="Categorias" description="Gerencie as classificações globais utilizadas nos faturamentos." />
      <ListFilters hasActiveFilters={Boolean(search)} newLabel="Nova categoria" onClear={() => setSearch('')} onNew={() => onNavigate('nova-categoria')}>
        <div className="col-12"><label className="form-label" htmlFor="categorias-search">Buscar</label><input className="form-control" id="categorias-search" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome da categoria..." value={search} /></div>
      </ListFilters>
      <section className="table-card">
        <div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th scope="col">Categoria</th><th scope="col">Descrição</th><th scope="col">Situação</th><th className="text-end" scope="col">Ações</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td className="cell-main">{item.nome}</td><td>{item.descricao}</td><td><StatusBadge status={item.ativa ? 'ATIVA' : 'INATIVA'} /></td><td className="text-end"><button className="btn btn-link btn-table-action" type="button" onClick={() => setSelectedCategoria(item)}>Visualizar</button></td></tr>)}</tbody></table></div>
        {!items.length && <TableEmpty hasFilters={Boolean(search)} noun="categoria" onClear={() => setSearch('')} />}
        <div className="table-footer">Mostrando {items.length} de {categorias.length} categorias</div>
      </section>
      <CategoriaDetailsModal categoria={selectedCategoria} onClose={() => setSelectedCategoria(null)} />
    </div>
  )
}

export default CategoriasPage
