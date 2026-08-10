import PageHeader from '../../components/layout/PageHeader'
import UsuarioForm from './components/UsuarioForm'

function NovoUsuario({ onNavigate }) {
  return (
    <div className="form-page">
      <PageHeader title="Novo usuário" description="Cadastre um usuário interno para acesso ao controle de faturamento." />
      <section className="form-card" aria-labelledby="usuario-form-title">
        <div className="form-card-header">
          <div><h2 id="usuario-form-title">Dados do usuário</h2><p>O usuário será criado para uso interno do escritório.</p></div>
          <span className="required-note"><span className="required-mark">*</span> Campos obrigatórios</span>
        </div>
        <div className="form-card-body"><UsuarioForm onCancel={() => onNavigate('usuarios')} /></div>
      </section>
    </div>
  )
}

export default NovoUsuario
