import PageHeader from '../../components/layout/PageHeader'
import FaturamentoForm from './components/FaturamentoForm'

function NovoFaturamento({ onNavigate }) {
  return (
    <div className="form-page form-page-wide">
      <PageHeader title="Novo lançamento" description="Registre um lançamento para uma empresa e categoria previamente cadastradas." />
      <section className="form-card" aria-labelledby="faturamento-form-title">
        <div className="form-card-header">
          <div><h2 id="faturamento-form-title">Dados do lançamento</h2><p>Revise todas as informações antes da confirmação definitiva.</p></div>
          <span className="required-note"><span className="required-mark">*</span> Campos obrigatórios</span>
        </div>
        <div className="form-card-body"><FaturamentoForm onCancel={() => onNavigate('faturamentos')} onCreated={(id) => onNavigate('faturamento-detalhes', id)} /></div>
      </section>
    </div>
  )
}

export default NovoFaturamento
