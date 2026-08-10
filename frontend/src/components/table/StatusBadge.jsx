const statusConfig = {
  ATIVO: { label: 'Ativo', className: 'status-active' },
  ATIVA: { label: 'Ativa', className: 'status-active' },
  INATIVO: { label: 'Inativo', className: 'status-inactive' },
  INATIVA: { label: 'Inativa', className: 'status-inactive' },
  CANCELADO: { label: 'Cancelado', className: 'status-cancelled' },
}

function StatusBadge({ status }) {
  const config = statusConfig[status] ?? { label: status, className: 'status-neutral' }
  return <span className={`badge status-badge ${config.className}`}>{config.label}</span>
}

export default StatusBadge
