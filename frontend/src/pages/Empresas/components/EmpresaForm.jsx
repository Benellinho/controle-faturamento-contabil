import { useState } from 'react'
import FormActions from '../../../components/forms/FormActions'
import FormFeedback from '../../../components/forms/FormFeedback'

const initialValues = {
  cnpj: '',
  razao_social: '',
  nome_fantasia: '',
  ativa: true,
}

function formatCnpj(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function EmpresaForm({ onCancel }) {
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
    const cnpjDigits = values.cnpj.replace(/\D/g, '')

    if (cnpjDigits.length !== 14) nextErrors.cnpj = 'Informe um CNPJ com 14 dígitos.'
    if (!values.razao_social.trim()) nextErrors.razao_social = 'Informe a razão social da empresa.'
    if (values.razao_social.trim().length > 200) nextErrors.razao_social = 'A razão social deve ter no máximo 200 caracteres.'
    if (values.nome_fantasia.trim().length > 150) nextErrors.nome_fantasia = 'O nome fantasia deve ter no máximo 150 caracteres.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setSuccessMessage('')
    await new Promise((resolve) => setTimeout(resolve, 600))

    const payload = {
      ...values,
      cnpj: values.cnpj.replace(/\D/g, ''),
      razao_social: values.razao_social.trim(),
      nome_fantasia: values.nome_fantasia.trim() || null,
    }

    setIsSubmitting(false)
    setSuccessMessage(`Empresa “${payload.razao_social}” validada com sucesso no ambiente de demonstração.`)
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <FormFeedback message={successMessage} />
      <div className="row g-3">
        <div className="col-12 col-md-7">
          <label className="form-label" htmlFor="empresa-cnpj">CNPJ <span className="required-mark">*</span></label>
          <input
            className={`form-control ${errors.cnpj ? 'is-invalid' : ''}`}
            id="empresa-cnpj"
            inputMode="numeric"
            onChange={(event) => updateField('cnpj', formatCnpj(event.target.value))}
            placeholder="00.000.000/0000-00"
            value={values.cnpj}
          />
          {errors.cnpj && <div className="invalid-feedback">{errors.cnpj}</div>}
        </div>
        <div className="col-12 col-md-5">
          <label className="form-label" htmlFor="empresa-ativa">Situação <span className="required-mark">*</span></label>
          <select className="form-select" id="empresa-ativa" onChange={(event) => updateField('ativa', event.target.value === 'true')} value={String(values.ativa)}>
            <option value="true">Ativa</option>
            <option value="false">Inativa</option>
          </select>
        </div>
        <div className="col-12">
          <label className="form-label" htmlFor="empresa-razao-social">Razão social <span className="required-mark">*</span></label>
          <input
            className={`form-control ${errors.razao_social ? 'is-invalid' : ''}`}
            id="empresa-razao-social"
            maxLength="200"
            onChange={(event) => updateField('razao_social', event.target.value)}
            placeholder="Razão social da empresa"
            value={values.razao_social}
          />
          {errors.razao_social && <div className="invalid-feedback">{errors.razao_social}</div>}
        </div>
        <div className="col-12">
          <label className="form-label" htmlFor="empresa-nome-fantasia">Nome fantasia <span className="optional-label">Opcional</span></label>
          <input
            className={`form-control ${errors.nome_fantasia ? 'is-invalid' : ''}`}
            id="empresa-nome-fantasia"
            maxLength="150"
            onChange={(event) => updateField('nome_fantasia', event.target.value)}
            placeholder="Nome pelo qual a empresa é conhecida"
            value={values.nome_fantasia}
          />
          {errors.nome_fantasia && <div className="invalid-feedback">{errors.nome_fantasia}</div>}
        </div>
      </div>
      <FormActions isSubmitting={isSubmitting} onCancel={onCancel} submitLabel="Salvar empresa" />
    </form>
  )
}

export default EmpresaForm
