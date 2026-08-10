function TableEmpty({ hasFilters, onClear, noun = 'registro' }) {
  return (
    <div className="table-empty">
      <strong>Nenhum {noun} encontrado.</strong>
      <span>{hasFilters ? 'Tente ajustar ou limpar os filtros selecionados.' : `Ainda não existem ${noun}s cadastrados.`}</span>
      {hasFilters && <button className="btn btn-outline-secondary btn-sm" type="button" onClick={onClear}>Limpar filtros</button>}
    </div>
  )
}

export default TableEmpty
