import PageHeader from '../../components/layout/PageHeader'
import CategoriaForm from './components/CategoriaForm'

function NovaCategoria({ onNavigate }) {
  return (
    <div className="form-page">
      <PageHeader title="Nova categoria" description="Cadastre uma classificação global para os lançamentos de faturamento." />
      <section className="form-card" aria-labelledby="categoria-form-title">
        <div className="form-card-header"><div><h2 id="categoria-form-title">Dados da categoria</h2><p>Categorias ativas ficam disponíveis para todas as empresas.</p></div><span className="required-note"><span className="required-mark">*</span> Campos obrigatórios</span></div>
        <div className="form-card-body"><CategoriaForm onCancel={() => onNavigate('categorias')} /></div>
      </section>
    </div>
  )
}

export default NovaCategoria
