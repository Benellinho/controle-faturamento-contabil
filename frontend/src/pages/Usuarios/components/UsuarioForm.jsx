import { useState } from 'react'
import FormActions from '../../../components/forms/FormActions'
import FormFeedback from '../../../components/forms/FormFeedback'

const initialValues = {
  nome: '',
  email: '',
  senha: '',
  cargo: '',
  ativo: true,
}

function UsuarioForm({ onCancel }) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setSuccessMessage('')
  }

  function validate() {
    const nextErrors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!values.nome.trim()) nextErrors.nome = 'Informe o nome do usuário.'
    if (values.nome.trim().length > 150) nextErrors.nome = 'O nome deve ter no máximo 150 caracteres.'
    if (!emailPattern.test(values.email.trim())) nextErrors.email = 'Informe um endereço de e-mail válido.'
    if (values.email.trim().length > 255) nextErrors.email = 'O e-mail deve ter no máximo 255 caracteres.'
    if (!values.senha) nextErrors.senha = 'Defina uma senha inicial para o usuário.'
    if (!values.cargo.trim()) nextErrors.cargo = 'Informe o cargo do usuário.'
    if (values.cargo.trim().length > 50) nextErrors.cargo = 'O cargo deve ter no máximo 50 caracteres.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setSuccessMessage('')
    await new Promise((resolve) => setTimeout(resolve, 600))
    setIsSubmitting(false)
    setSuccessMessage(`Usuário “${values.nome.trim()}” validado com sucesso no ambiente de demonstração.`)
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <FormFeedback message={successMessage} />
      <div className="row g-3">
        <div className="col-12">
          <label className="form-label" htmlFor="usuario-nome">Nome <span className="required-mark">*</span></label>
          <input className={`form-control ${errors.nome ? 'is-invalid' : ''}`} id="usuario-nome" maxLength="150" onChange={(event) => updateField('nome', event.target.value)} placeholder="Nome completo" value={values.nome} />
          {errors.nome && <div className="invalid-feedback">{errors.nome}</div>}
        </div>
        <div className="col-12 col-md-7">
          <label className="form-label" htmlFor="usuario-email">E-mail <span className="required-mark">*</span></label>
          <input autoComplete="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} id="usuario-email" maxLength="255" onChange={(event) => updateField('email', event.target.value)} placeholder="nome@escritorio.com.br" type="email" value={values.email} />
          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
        </div>
        <div className="col-12 col-md-5">
          <label className="form-label" htmlFor="usuario-cargo">Cargo <span className="required-mark">*</span></label>
          <input className={`form-control ${errors.cargo ? 'is-invalid' : ''}`} id="usuario-cargo" maxLength="50" onChange={(event) => updateField('cargo', event.target.value)} placeholder="Ex.: Analista" value={values.cargo} />
          {errors.cargo && <div className="invalid-feedback">{errors.cargo}</div>}
        </div>
        <div className="col-12 col-md-7">
          <label className="form-label" htmlFor="usuario-senha">Senha inicial <span className="required-mark">*</span></label>
          <input autoComplete="new-password" className={`form-control ${errors.senha ? 'is-invalid' : ''}`} id="usuario-senha" onChange={(event) => updateField('senha', event.target.value)} placeholder="Defina uma senha temporária" type="password" value={values.senha} />
          {errors.senha ? <div className="invalid-feedback">{errors.senha}</div> : <div className="form-text">A autenticação e a troca de senha serão gerenciadas pelo Supabase Auth.</div>}
        </div>
        <div className="col-12 col-md-5">
          <label className="form-label" htmlFor="usuario-ativo">Situação <span className="required-mark">*</span></label>
          <select className="form-select" id="usuario-ativo" onChange={(event) => updateField('ativo', event.target.value === 'true')} value={String(values.ativo)}>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>
      </div>
      <FormActions isSubmitting={isSubmitting} onCancel={onCancel} submitLabel="Criar usuário" />
    </form>
  )
}

export default UsuarioForm
