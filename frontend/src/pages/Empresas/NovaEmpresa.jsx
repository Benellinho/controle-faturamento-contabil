import PageHeader from '../../components/layout/PageHeader'
import EmpresaForm from './components/EmpresaForm'

function NovaEmpresa({ onNavigate }) {
  return (
    <div className="form-page">
      <PageHeader title="Nova empresa" description="Cadastre uma empresa para iniciar o acompanhamento das competências mensais." />
      <section className="form-card" aria-labelledby="empresa-form-title">
        <div className="form-card-header">
          <div><h2 id="empresa-form-title">Dados da empresa</h2><p>Informe somente os dados utilizados no controle de faturamento.</p></div>
          <span className="required-note"><span className="required-mark">*</span> Campos obrigatórios</span>
        </div>
        <div className="form-card-body"><EmpresaForm onCancel={() => onNavigate('empresas')} /></div>
      </section>
    </div>
  )
}

export default NovaEmpresa
