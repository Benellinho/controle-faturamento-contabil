import { useState } from 'react'
import FormActions from '../../../components/forms/FormActions'
import FormFeedback from '../../../components/forms/FormFeedback'

function CategoriaForm({ onCancel }) {
  const [values, setValues] = useState({ nome: '', descricao: '', ativa: true })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  function updateField(field, value) { setValues((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: '' })); setMessage('') }
  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!values.nome.trim()) nextErrors.nome = 'Informe o nome da categoria.'
    if (values.nome.trim().length > 120) nextErrors.nome = 'O nome deve ter no máximo 120 caracteres.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setIsSubmitting(false)
    setMessage(`Categoria “${values.nome.trim()}” validada com sucesso no ambiente de demonstração.`)
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <FormFeedback message={message} />
      <div className="row g-3">
        <div className="col-12 col-md-8"><label className="form-label" htmlFor="categoria-nome">Nome <span className="required-mark">*</span></label><input className={`form-control ${errors.nome ? 'is-invalid' : ''}`} id="categoria-nome" maxLength="120" onChange={(event) => updateField('nome', event.target.value)} placeholder="Nome da categoria" value={values.nome} />{errors.nome && <div className="invalid-feedback">{errors.nome}</div>}</div>
        <div className="col-12 col-md-4"><label className="form-label" htmlFor="categoria-ativa">Situação <span className="required-mark">*</span></label><select className="form-select" id="categoria-ativa" onChange={(event) => updateField('ativa', event.target.value === 'true')} value={String(values.ativa)}><option value="true">Ativa</option><option value="false">Inativa</option></select></div>
        <div className="col-12"><label className="form-label" htmlFor="categoria-descricao">Descrição <span className="optional-label">Opcional</span></label><textarea className="form-control" id="categoria-descricao" onChange={(event) => updateField('descricao', event.target.value)} placeholder="Descreva quando esta categoria deve ser utilizada" rows="4" value={values.descricao} /></div>
      </div>
      <FormActions isSubmitting={isSubmitting} onCancel={onCancel} submitLabel="Salvar categoria" />
    </form>
  )
}

export default CategoriaForm
