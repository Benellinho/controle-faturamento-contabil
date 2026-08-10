function DetailItem({ className = 'col-12 col-md-6', label, value }) {
  return (
    <div className={className}>
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value ?? '—'}</span>
    </div>
  )
}

export default DetailItem
