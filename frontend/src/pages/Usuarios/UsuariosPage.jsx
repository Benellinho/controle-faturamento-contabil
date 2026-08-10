import { useMemo, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import ListFilters from '../../components/table/ListFilters'
import StatusBadge from '../../components/table/StatusBadge'
import TableEmpty from '../../components/table/TableEmpty'
import { usuarios } from '../../mocks/listData'

function UsuariosPage({ onNavigate }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('todos')
  const hasActiveFilters = Boolean(search || status !== 'todos')
  const filteredItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return usuarios.filter((usuario) => {
      const textMatch = !term || usuario.nome.toLocaleLowerCase('pt-BR').includes(term) || usuario.email.toLocaleLowerCase('pt-BR').includes(term)
      const statusMatch = status === 'todos' || (status === 'ativos' ? usuario.ativo : !usuario.ativo)
      return textMatch && statusMatch
    })
  }, [search, status])

  function clearFilters() { setSearch(''); setStatus('todos') }

  return (
    <div className="list-page">
      <PageHeader title="Usuários" description="Consulte e administre os usuários internos do escritório." />
      <ListFilters hasActiveFilters={hasActiveFilters} newLabel="Novo usuário" onClear={clearFilters} onNew={() => onNavigate('novo-usuario')}>
        <div className="col-12 col-lg-8"><label className="form-label" htmlFor="usuarios-search">Buscar</label><input className="form-control" id="usuarios-search" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou e-mail..." value={search} /></div>
        <div className="col-12 col-lg-4"><label className="form-label" htmlFor="usuarios-status">Situação</label><select className="form-select" id="usuarios-status" onChange={(event) => setStatus(event.target.value)} value={status}><option value="todos">Todos</option><option value="ativos">Ativos</option><option value="inativos">Inativos</option></select></div>
      </ListFilters>
      <section className="table-card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead><tr><th scope="col">Nome</th><th scope="col">E-mail</th><th scope="col">Cargo</th><th scope="col">Situação</th><th className="text-end" scope="col">Ações</th></tr></thead>
            <tbody>{filteredItems.map((usuario) => <tr key={usuario.id}><td className="cell-main">{usuario.nome}</td><td>{usuario.email}</td><td>{usuario.cargo}</td><td><StatusBadge status={usuario.ativo ? 'ATIVO' : 'INATIVO'} /></td><td className="text-end"><button className="btn btn-link btn-table-action" type="button" onClick={() => onNavigate('usuario-detalhes', usuario.id)}>Visualizar</button></td></tr>)}</tbody>
          </table>
        </div>
        {!filteredItems.length && <TableEmpty hasFilters={hasActiveFilters} noun="usuário" onClear={clearFilters} />}
        <div className="table-footer">Mostrando {filteredItems.length} de {usuarios.length} usuários</div>
      </section>
    </div>
  )
}

export default UsuariosPage
