import PageHeader from '../../components/layout/PageHeader'
import FaturamentoForm from './components/FaturamentoForm'

function NovoFaturamento({ initialEmpresaId, onNavigate }) {
  return (
    <div className="form-page form-page-wide">
      <PageHeader title="Novos lançamentos" description="Registre todas as categorias da empresa em uma única confirmação." />
      <section className="form-card" aria-labelledby="faturamento-form-title">
        <div className="form-card-header">
          <div><h2 id="faturamento-form-title">Lançamento por categoria</h2><p>Todos os registros são gravados juntos ou nenhum deles é criado.</p></div>
          <span className="required-note"><span className="required-mark">*</span> Campos obrigatórios</span>
        </div>
        <div className="form-card-body"><FaturamentoForm initialEmpresaId={initialEmpresaId} onCancel={() => onNavigate('faturamentos')} onCreated={() => onNavigate('faturamentos')} /></div>
      </section>
    </div>
  )
}

export default NovoFaturamento
