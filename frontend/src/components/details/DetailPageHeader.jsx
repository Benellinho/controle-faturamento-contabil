function DetailPageHeader({ actions, backLabel, eyebrow, onBack, subtitle, title }) {
  return (
    <>
      <button className="detail-back" type="button" onClick={onBack}>← {backLabel}</button>
      <header className="detail-page-header">
        <div>
          <span className="detail-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="detail-actions">{actions}</div>}
      </header>
    </>
  )
}

export default DetailPageHeader
