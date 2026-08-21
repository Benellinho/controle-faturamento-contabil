import { useEffect, useRef, useState } from 'react'
import ConfirmModal from '../../../components/common/ConfirmModal'
import FormActions from '../../../components/forms/FormActions'
import FormFeedback from '../../../components/forms/FormFeedback'
import MoneyInput from '../../../components/forms/MoneyInput'
import { listarCategorias, listarEmpresas } from '../../../services/empresasApi'
import { criarLancamento } from '../../../services/lancamentosApi'
import { formatCnpj, formatCurrencyFromCents, formatDate } from '../../../utils/formatters'
import {
  createInitialLancamentoValues,
  createSingleFlight,
  submitLancamentoValues,
  validateLancamentoValues,
} from '../faturamentoForm'

function FaturamentoForm({ onCancel, onCreated }) {
  const [values, setValues] = useState(createInitialLancamentoValues)
  const [empresas, setEmpresas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [isLoadingEmpresas, setIsLoadingEmpresas] = useState(true)
  const [isLoadingCategorias, setIsLoadingCategorias] = useState(false)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submission = useRef(createSingleFlight())

  const selectedEmpresa = empresas.find((item) => item.id === Number(values.empresa_id))
  const selectedCategoria = categorias.find((item) => item.id === Number(values.categoria_id))

  useEffect(() => {
    const controller = new AbortController()

    listarEmpresas({ signal: controller.signal })
      .then(setEmpresas)
      .catch((error) => {
        if (!controller.signal.aborted) setApiError(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingEmpresas(false)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    if (!values.empresa_id) {
      return () => controller.abort()
    }

    listarCategorias(values.empresa_id, { signal: controller.signal })
      .then(setCategorias)
      .catch((error) => {
        if (!controller.signal.aborted) setApiError(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingCategorias(false)
      })

    return () => controller.abort()
  }, [values.empresa_id])

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setApiError('')
  }

  function handleEmpresaChange(empresaId) {
    setCategorias([])
    setIsLoadingCategorias(Boolean(empresaId))
    setValues((current) => ({
      ...current,
      empresa_id: empresaId,
      categoria_id: '',
    }))
    setErrors((current) => ({
      ...current,
      empresa_id: '',
      categoria_id: '',
    }))
    setApiError('')
  }

  function validate() {
    const nextErrors = validateLancamentoValues(values)

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleReview(event) {
    event.preventDefault()
    if (validate()) setIsReviewOpen(true)
  }

  async function handleConfirm() {
    await submission.current.run(async () => {
      setIsSubmitting(true)
      setApiError('')

      try {
        await submitLancamentoValues(values, {
          createLancamento: criarLancamento,
          onCreated,
        })
        setIsReviewOpen(false)
      } catch (error) {
        setIsReviewOpen(false)
        setApiError(error.message)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } finally {
        setIsSubmitting(false)
      }
    })
  }

  return (
    <>
      <form noValidate onSubmit={handleReview}>
        <FormFeedback message={apiError} type="danger" />

        <fieldset className="form-section">
          <legend>Identificação</legend>
          <p className="form-section-description">Selecione a empresa e uma categoria pertencente a ela.</p>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label" htmlFor="faturamento-empresa">Empresa <span className="required-mark">*</span></label>
              <select className={`form-select ${errors.empresa_id ? 'is-invalid' : ''}`} disabled={isLoadingEmpresas} id="faturamento-empresa" onChange={(event) => handleEmpresaChange(event.target.value)} value={values.empresa_id}>
                <option value="">{isLoadingEmpresas ? 'Carregando empresas...' : 'Selecione uma empresa'}</option>
                {empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome} — {formatCnpj(empresa.cnpj)}</option>)}
              </select>
              {errors.empresa_id && <div className="invalid-feedback">{errors.empresa_id}</div>}
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="faturamento-categoria">Categoria <span className="required-mark">*</span></label>
              <select className={`form-select ${errors.categoria_id ? 'is-invalid' : ''}`} disabled={!values.empresa_id || isLoadingCategorias} id="faturamento-categoria" onChange={(event) => updateField('categoria_id', event.target.value)} value={values.categoria_id}>
                <option value="">{isLoadingCategorias ? 'Carregando categorias...' : values.empresa_id ? 'Selecione uma categoria' : 'Selecione primeiro a empresa'}</option>
                {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}
              </select>
              {errors.categoria_id && <div className="invalid-feedback">{errors.categoria_id}</div>}
            </div>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Dados do lançamento</legend>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="faturamento-data">Data de referência <span className="required-mark">*</span></label>
              <input className={`form-control ${errors.data_referencia ? 'is-invalid' : ''}`} id="faturamento-data" onChange={(event) => updateField('data_referencia', event.target.value)} type="date" value={values.data_referencia} />
              {errors.data_referencia && <div className="invalid-feedback">{errors.data_referencia}</div>}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="faturamento-valor">Valor <span className="required-mark">*</span></label>
              <MoneyInput id="faturamento-valor" invalid={Boolean(errors.valor)} onChange={(value) => updateField('valor', value)} placeholder="R$ 0,00" value={values.valor} />
              {errors.valor && <div className="invalid-feedback">{errors.valor}</div>}
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="faturamento-observacao">Observação <span className="optional-label">Opcional</span></label>
              <textarea className="form-control" id="faturamento-observacao" onChange={(event) => updateField('observacao', event.target.value)} placeholder="Inclua uma informação relevante sobre este lançamento" rows="4" value={values.observacao} />
            </div>
          </div>
        </fieldset>

        <FormActions isSubmitting={isSubmitting} onCancel={onCancel} submitLabel="Revisar lançamento" submittingLabel="Confirmando..." />
      </form>

      <ConfirmModal confirmLabel="Confirmar lançamento" isOpen={isReviewOpen} isSubmitting={isSubmitting} onClose={() => setIsReviewOpen(false)} onConfirm={handleConfirm} title="Confirmar lançamento">
        <dl className="review-list">
          <div><dt>Empresa</dt><dd>{selectedEmpresa?.nome} — {selectedEmpresa && formatCnpj(selectedEmpresa.cnpj)}</dd></div>
          <div><dt>Categoria</dt><dd>{selectedCategoria?.nome}</dd></div>
          <div><dt>Data de referência</dt><dd>{formatDate(values.data_referencia)}</dd></div>
          <div><dt>Valor</dt><dd>{formatCurrencyFromCents(values.valor)}</dd></div>
          <div><dt>Observação</dt><dd>{values.observacao.trim() || '—'}</dd></div>
        </dl>
        <div className="alert alert-warning mb-0" role="note">
          Após confirmado, este lançamento não poderá ser editado. Uma correção exigirá substituição.
        </div>
      </ConfirmModal>
    </>
  )
}

export default FaturamentoForm
