function DetailSection({ children, title }) {
  return (
    <section className="detail-section">
      <h2>{title}</h2>
      <div className="detail-section-body"><div className="row g-4">{children}</div></div>
    </section>
  )
}

export default DetailSection
