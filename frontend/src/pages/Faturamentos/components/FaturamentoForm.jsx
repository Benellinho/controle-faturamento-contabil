import { useEffect, useRef, useState } from 'react'
import ConfirmModal from '../../../components/common/ConfirmModal'
import FormActions from '../../../components/forms/FormActions'
import FormFeedback from '../../../components/forms/FormFeedback'
import MoneyInput from '../../../components/forms/MoneyInput'
import PercentageInput from '../../../components/forms/PercentageInput'
import { listarCategorias, listarEmpresas } from '../../../services/empresasApi'
import { criarLancamentosLote } from '../../../services/lancamentosApi'
import { formatCnpj, formatCurrencyFromCents, formatReferenceMonth } from '../../../utils/formatters'
import {
  createCategoriaItems,
  createInitialLancamentoValues,
  createSingleFlight,
  referenceDateFromMonth,
  submitLancamentoValues,
  validateLancamentoValues,
} from '../faturamentoForm'

function FaturamentoForm({ initialEmpresaId, onCancel, onCreated }) {
  const [values, setValues] = useState(() => createInitialLancamentoValues(new Date(), initialEmpresaId))
  const [empresas, setEmpresas] = useState([])
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [isLoadingEmpresas, setIsLoadingEmpresas] = useState(true)
  const [isLoadingCategorias, setIsLoadingCategorias] = useState(Boolean(values.empresa_id))
  const [hasLoadedCategorias, setHasLoadedCategorias] = useState(false)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submission = useRef(createSingleFlight())

  const selectedEmpresa = empresas.find((item) => item.id === Number(values.empresa_id))

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

    if (!values.empresa_id) return () => controller.abort()

    listarCategorias(values.empresa_id, { signal: controller.signal })
      .then((categorias) => {
        if (!controller.signal.aborted) {
          setValues((current) => ({ ...current, itens: createCategoriaItems(categorias) }))
          setHasLoadedCategorias(true)
          setApiError('')
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setHasLoadedCategorias(false)
          setApiError(error.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingCategorias(false)
      })

    return () => controller.abort()
  }, [values.empresa_id])

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors({})
    setApiError('')
  }

  function updateItem(categoriaId, field, value) {
    setValues((current) => ({
      ...current,
      itens: current.itens.map((item) => (
        item.categoria_id === categoriaId ? { ...item, [field]: value } : item
      )),
    }))
    setErrors({})
    setApiError('')
  }

  function handleEmpresaChange(empresaId) {
    setIsLoadingCategorias(Boolean(empresaId))
    setHasLoadedCategorias(false)
    setValues((current) => ({ ...current, empresa_id: empresaId, itens: [] }))
    setErrors({})
    setApiError('')
  }

  function handleReview(event) {
    event.preventDefault()
    const nextErrors = validateLancamentoValues(values)
    setErrors(nextErrors)
    if (!Object.keys(nextErrors).length) setIsReviewOpen(true)
  }

  async function handleConfirm() {
    await submission.current.run(async () => {
      setIsSubmitting(true)
      setApiError('')

      try {
        await submitLancamentoValues(values, {
          createLancamentos: criarLancamentosLote,
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

        <fieldset className="form-section" disabled={isSubmitting}>
          <legend>Identificação do lote</legend>
          <p className="form-section-description">Escolha a empresa e a data comum a todos os lançamentos.</p>
          <div className="row g-3">
            <div className="col-12 col-md-7">
              <label className="form-label" htmlFor="faturamento-empresa">Empresa <span className="required-mark">*</span></label>
              <select className={`form-select ${errors.empresa_id ? 'is-invalid' : ''}`} disabled={isLoadingEmpresas} id="faturamento-empresa" onChange={(event) => handleEmpresaChange(event.target.value)} value={values.empresa_id}>
                <option value="">{isLoadingEmpresas ? 'Carregando empresas...' : 'Selecione uma empresa'}</option>
                {empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome} — {formatCnpj(empresa.cnpj)}</option>)}
              </select>
              {errors.empresa_id && <div className="invalid-feedback">{errors.empresa_id}</div>}
            </div>
            <div className="col-12 col-md-5">
              <label className="form-label" htmlFor="faturamento-data">Mês de referência <span className="required-mark">*</span></label>
              <input className={`form-control ${errors.data_referencia ? 'is-invalid' : ''}`} id="faturamento-data" onChange={(event) => updateField('data_referencia', referenceDateFromMonth(event.target.value))} type="month" value={values.data_referencia.slice(0, 7)} />
              {errors.data_referencia && <div className="invalid-feedback">{errors.data_referencia}</div>}
            </div>
          </div>
        </fieldset>

        <fieldset className="form-section" disabled={isSubmitting}>
          <legend>Saldos da competência</legend>
          <p className="form-section-description">Informe os saldos de estoque e caixa referentes ao mês selecionado.</p>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="faturamento-estoque-inicial">Estoque inicial <span className="required-mark">*</span></label>
              <MoneyInput id="faturamento-estoque-inicial" invalid={Boolean(errors.estoque_inicial)} onChange={(value) => updateField('estoque_inicial', value)} value={values.estoque_inicial} />
              {errors.estoque_inicial && <div className="invalid-feedback">{errors.estoque_inicial}</div>}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="faturamento-estoque-final">Estoque final <span className="required-mark">*</span></label>
              <MoneyInput id="faturamento-estoque-final" invalid={Boolean(errors.estoque_final)} onChange={(value) => updateField('estoque_final', value)} value={values.estoque_final} />
              {errors.estoque_final && <div className="invalid-feedback">{errors.estoque_final}</div>}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="faturamento-caixa-inicial">Caixa inicial <span className="required-mark">*</span></label>
              <MoneyInput id="faturamento-caixa-inicial" invalid={Boolean(errors.caixa_inicial)} onChange={(value) => updateField('caixa_inicial', value)} value={values.caixa_inicial} />
              {errors.caixa_inicial && <div className="invalid-feedback">{errors.caixa_inicial}</div>}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="faturamento-caixa-final">Caixa final <span className="required-mark">*</span></label>
              <MoneyInput id="faturamento-caixa-final" invalid={Boolean(errors.caixa_final)} onChange={(value) => updateField('caixa_final', value)} value={values.caixa_final} />
              {errors.caixa_final && <div className="invalid-feedback">{errors.caixa_final}</div>}
            </div>
          </div>
        </fieldset>

        <fieldset className="form-section" disabled={isSubmitting || isLoadingCategorias || !values.empresa_id}>
          <legend>Categorias da empresa</legend>
          <p className="form-section-description">Preencha valor e percentual de imposto para todas as categorias. O imposto é calculado automaticamente e não é armazenado.</p>

          {isLoadingCategorias && <div className="p-3 text-center" role="status"><span className="spinner-border spinner-border-sm" aria-hidden="true" /> Carregando categorias...</div>}
          {hasLoadedCategorias && !isLoadingCategorias && values.empresa_id && values.itens.length === 0 && <div className="alert alert-warning">Esta empresa não possui categorias cadastradas.</div>}
          {typeof errors.itens === 'string' && <div className="alert alert-danger">{errors.itens}</div>}

          <div className="category-entry-list">
            {values.itens.map((item) => {
              const itemErrors = errors.itens?.[item.categoria_id] ?? {}
              const percentage = Number(String(item.percentual_imposto).replace(',', '.')) || 0
              const taxInCents = Math.round((item.valor ?? 0) * percentage / 100)

              return (
                <article className="category-entry" key={item.categoria_id}>
                  <h3>{item.categoria_nome}</h3>
                  <div className="row g-3">
                    <div className="col-12 col-md-7">
                      <label className="form-label" htmlFor={`categoria-${item.categoria_id}-valor`}>Valor <span className="required-mark">*</span></label>
                      <MoneyInput id={`categoria-${item.categoria_id}-valor`} invalid={Boolean(itemErrors.valor)} onChange={(value) => updateItem(item.categoria_id, 'valor', value)} value={item.valor} />
                      {itemErrors.valor && <div className="invalid-feedback">{itemErrors.valor}</div>}
                    </div>
                    <div className="col-12 col-md-5">
                      <label className="form-label" htmlFor={`categoria-${item.categoria_id}-imposto`}>% de imposto <span className="required-mark">*</span></label>
                      <div className="input-group">
                        <PercentageInput id={`categoria-${item.categoria_id}-imposto`} invalid={Boolean(itemErrors.percentual_imposto)} onChange={(value) => updateItem(item.categoria_id, 'percentual_imposto', value)} value={item.percentual_imposto} />
                        <span className="input-group-text">%</span>
                        {itemErrors.percentual_imposto && <div className="invalid-feedback">{itemErrors.percentual_imposto}</div>}
                      </div>
                      <div className="form-text">Imposto: {formatCurrencyFromCents(taxInCents)}</div>
                    </div>
                    <div className="col-12">
                      <label className="form-label" htmlFor={`categoria-${item.categoria_id}-observacao`}>Observação <span className="optional-label">Opcional</span></label>
                      <input className="form-control" id={`categoria-${item.categoria_id}-observacao`} onChange={(event) => updateItem(item.categoria_id, 'observacao', event.target.value)} type="text" value={item.observacao} />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </fieldset>

        <FormActions isSubmitting={isSubmitting} onCancel={onCancel} submitLabel="Revisar todos os lançamentos" submittingLabel="Confirmando..." />
      </form>

      <ConfirmModal confirmLabel="Confirmar todos" isOpen={isReviewOpen} isSubmitting={isSubmitting} onClose={() => setIsReviewOpen(false)} onConfirm={handleConfirm} title="Confirmar lançamentos">
        <p><strong>{selectedEmpresa?.nome}</strong><br />Mês de referência: {formatReferenceMonth(values.data_referencia)}</p>
        <dl className="review-list">
          <div><dt>Estoque inicial</dt><dd>{formatCurrencyFromCents(values.estoque_inicial)}</dd></div>
          <div><dt>Estoque final</dt><dd>{formatCurrencyFromCents(values.estoque_final)}</dd></div>
          <div><dt>Caixa inicial</dt><dd>{formatCurrencyFromCents(values.caixa_inicial)}</dd></div>
          <div><dt>Caixa final</dt><dd>{formatCurrencyFromCents(values.caixa_final)}</dd></div>
        </dl>
        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0">
            <thead><tr><th>Categoria</th><th className="text-end">Valor</th><th className="text-end">Imposto</th></tr></thead>
            <tbody>{values.itens.map((item) => {
              const percentage = Number(String(item.percentual_imposto).replace(',', '.')) || 0
              return <tr key={item.categoria_id}><td>{item.categoria_nome}<small className="d-block text-body-secondary">{percentage.toLocaleString('pt-BR')}%</small></td><td className="text-end">{formatCurrencyFromCents(item.valor)}</td><td className="text-end">{formatCurrencyFromCents(Math.round(item.valor * percentage / 100))}</td></tr>
            })}</tbody>
          </table>
        </div>
        <div className="alert alert-warning mt-3 mb-0" role="note">Após confirmados, os lançamentos não poderão ser editados. Correções exigirão substituição individual.</div>
      </ConfirmModal>
    </>
  )
}

export default FaturamentoForm
