function PageHeader({ title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <div className="d-flex align-items-center gap-2 mb-2"><span className="demo-badge d-none d-lg-inline-flex">AMBIENTE DE DEMONSTRAÇÃO</span></div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  )
}

export default PageHeader
