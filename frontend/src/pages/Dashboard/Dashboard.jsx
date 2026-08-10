import Icon from '../../components/common/Icon'
import PageHeader from '../../components/layout/PageHeader'

const summaries = [
  { label: 'Empresas ativas', value: '—', helper: 'Empresas em acompanhamento', icon: 'companies' },
  { label: 'Competências abertas', value: '—', helper: 'Aguardando lançamento', icon: 'billing' },
  { label: 'Em conferência', value: '—', helper: 'Pendentes de finalização', icon: 'history' },
]

function Dashboard({ onNavigate }) {
  return (
    <div className="container-fluid px-0" id="dashboard">
      <PageHeader title="Dashboard" description="Acompanhe o faturamento e as competências das empresas em um só lugar." action={<button className="btn btn-primary" type="button" onClick={() => onNavigate('novo-faturamento')}>Novo lançamento <Icon name="arrow" size={17} /></button>} />
      <div className="row g-3 g-xl-4 mb-4">
        {summaries.map((summary) => (
          <div className="col-12 col-md-4" key={summary.label}>
            <article className="summary-card h-100">
              <div className="summary-icon"><Icon name={summary.icon} size={22} /></div>
              <div><span>{summary.label}</span><strong>{summary.value}</strong><small>{summary.helper}</small></div>
            </article>
          </div>
        ))}
      </div>
      <section className="content-card">
        <div className="content-card-header">
          <div><h2>Competências que exigem atenção</h2><p>Os itens pendentes e próximos passos aparecerão aqui.</p></div>
          <button className="btn btn-outline-secondary btn-sm" type="button">Ver todas</button>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon"><Icon name="billing" size={28} /></div>
          <h3>Nenhuma informação carregada</h3>
          <p>Este espaço já está preparado para receber os dados da camada de serviço.</p>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
