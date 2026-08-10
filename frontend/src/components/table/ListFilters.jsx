function ListFilters({ children, hasActiveFilters, newLabel, onClear, onNew }) {
  return (
    <section className="filters-card" aria-labelledby="filters-title">
      <div className="filters-card-header">
        <h2 id="filters-title">Filtros</h2>
        {onNew && <button className="btn btn-primary btn-sm" type="button" onClick={onNew}>+ {newLabel}</button>}
      </div>
      <div className="filters-card-body">
        <div className="row g-3 align-items-end">{children}</div>
        {hasActiveFilters && <button className="clear-filters" type="button" onClick={onClear}>Limpar filtros</button>}
      </div>
    </section>
  )
}

export default ListFilters
