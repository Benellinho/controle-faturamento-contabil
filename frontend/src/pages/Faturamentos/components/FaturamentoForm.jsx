import { useMemo, useState } from 'react'
import ConfirmModal from '../../../components/common/ConfirmModal'
import FormActions from '../../../components/forms/FormActions'
import FormFeedback from '../../../components/forms/FormFeedback'
import MoneyInput from '../../../components/forms/MoneyInput'
import { categoriasAtivas, competenciasDisponiveis, empresasAtivas } from '../../../mocks/formOptions'
import { formatCompetencia, formatCurrencyFromCents } from '../../../utils/formatters'

const initialValues = {
  empresa_id: '',
  competencia_id: '',
  categoria_id: '',
  tipo_lancamento: 'FATURAMENTO',
  data_referencia: '',
  valor: null,
  estoque_inicial: null,
  estoque_final: null,
  observacao: '',
}

function competenciaLabel(competencia) { return formatCompetencia(competencia.ano, competencia.mes) }

function FaturamentoForm({ onCancel }) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const availableCompetencias = useMemo(
    () => competenciasDisponiveis.filter((item) => item.empresa_id === Number(values.empresa_id)),
    [values.empresa_id],
  )
  const selectedEmpresa = empresasAtivas.find((item) => item.id === Number(values.empresa_id))
  const selectedCompetencia = competenciasDisponiveis.find((item) => item.id === Number(values.competencia_id))
  const selectedCategoria = categoriasAtivas.find((item) => item.id === Number(values.categoria_id))

  const dateLimits = selectedCompetencia
    ? {
        min: `${selectedCompetencia.ano}-${String(selectedCompetencia.mes).padStart(2, '0')}-01`,
        max: new Date(selectedCompetencia.ano, selectedCompetencia.mes, 0).toISOString().slice(0, 10),
      }
    : { min: undefined, max: undefined }

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setSuccessMessage('')
  }

  function handleEmpresaChange(empresaId) {
    setValues((current) => ({ ...current, empresa_id: empresaId, competencia_id: '', data_referencia: '' }))
    setErrors((current) => ({ ...current, empresa_id: '', competencia_id: '', data_referencia: '' }))
    setSuccessMessage('')
  }

  function validate() {
    const nextErrors = {}

    if (!values.empresa_id) nextErrors.empresa_id = 'Selecione a empresa do lançamento.'
    if (!values.competencia_id) nextErrors.competencia_id = 'Selecione uma competência aberta ou reaberta.'
    if (!values.categoria_id) nextErrors.categoria_id = 'Selecione a categoria do faturamento.'
    if (!values.tipo_lancamento) nextErrors.tipo_lancamento = 'Selecione o tipo de lançamento.'
    if (!values.data_referencia) nextErrors.data_referencia = 'Informe a data de referência.'
    if (values.data_referencia && selectedCompetencia && (values.data_referencia < dateLimits.min || values.data_referencia > dateLimits.max)) {
      nextErrors.data_referencia = `A data deve pertencer à competência ${competenciaLabel(selectedCompetencia)}.`
    }
    if (values.valor === null || values.valor <= 0) nextErrors.valor = 'Informe um valor maior que zero.'
    if (values.estoque_inicial === null) nextErrors.estoque_inicial = 'Informe o estoque inicial, mesmo quando for zero.'
    if (values.estoque_final === null) nextErrors.estoque_final = 'Informe o estoque final, mesmo quando for zero.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleReview(event) {
    event.preventDefault()
    if (validate()) setIsReviewOpen(true)
  }

  async function handleConfirm() {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 700))
    setIsSubmitting(false)
    setIsReviewOpen(false)
    setSuccessMessage('Lançamento validado com sucesso no ambiente de demonstração.')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <form noValidate onSubmit={handleReview}>
        <FormFeedback message={successMessage} />

        <fieldset className="form-section">
          <legend>Identificação</legend>
          <p className="form-section-description">Selecione a empresa, a competência e a classificação do lançamento.</p>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label" htmlFor="faturamento-empresa">Empresa <span className="required-mark">*</span></label>
              <select className={`form-select ${errors.empresa_id ? 'is-invalid' : ''}`} id="faturamento-empresa" onChange={(event) => handleEmpresaChange(event.target.value)} value={values.empresa_id}>
                <option value="">Selecione uma empresa</option>
                {empresasAtivas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.razao_social}</option>)}
              </select>
              {errors.empresa_id && <div className="invalid-feedback">{errors.empresa_id}</div>}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="faturamento-competencia">Competência <span className="required-mark">*</span></label>
              <select className={`form-select ${errors.competencia_id ? 'is-invalid' : ''}`} disabled={!values.empresa_id} id="faturamento-competencia" onChange={(event) => updateField('competencia_id', event.target.value)} value={values.competencia_id}>
                <option value="">{values.empresa_id ? 'Selecione uma competência' : 'Selecione primeiro a empresa'}</option>
                {availableCompetencias.map((competencia) => <option key={competencia.id} value={competencia.id}>{competenciaLabel(competencia)} — {competencia.status === 'REABERTA' ? 'Reaberta' : 'Aberta'}</option>)}
              </select>
              {errors.competencia_id && <div className="invalid-feedback">{errors.competencia_id}</div>}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="faturamento-categoria">Categoria <span className="required-mark">*</span></label>
              <select className={`form-select ${errors.categoria_id ? 'is-invalid' : ''}`} id="faturamento-categoria" onChange={(event) => updateField('categoria_id', event.target.value)} value={values.categoria_id}>
                <option value="">Selecione uma categoria</option>
                {categoriasAtivas.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}
              </select>
              {errors.categoria_id && <div className="invalid-feedback">{errors.categoria_id}</div>}
            </div>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Dados do faturamento</legend>
          <p className="form-section-description">Valores de devolução ou estorno também devem ser informados como positivos.</p>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="faturamento-tipo">Tipo <span className="required-mark">*</span></label>
              <select className={`form-select ${errors.tipo_lancamento ? 'is-invalid' : ''}`} id="faturamento-tipo" onChange={(event) => updateField('tipo_lancamento', event.target.value)} value={values.tipo_lancamento}>
                <option value="FATURAMENTO">Faturamento</option>
                <option value="DEVOLUCAO_ESTORNO">Devolução / estorno</option>
              </select>
              {errors.tipo_lancamento && <div className="invalid-feedback">{errors.tipo_lancamento}</div>}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="faturamento-data">Data de referência <span className="required-mark">*</span></label>
              <input className={`form-control ${errors.data_referencia ? 'is-invalid' : ''}`} disabled={!selectedCompetencia} id="faturamento-data" max={dateLimits.max} min={dateLimits.min} onChange={(event) => updateField('data_referencia', event.target.value)} type="date" value={values.data_referencia} />
              {errors.data_referencia && <div className="invalid-feedback">{errors.data_referencia}</div>}
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="faturamento-valor">Valor <span className="required-mark">*</span></label>
              <MoneyInput id="faturamento-valor" invalid={Boolean(errors.valor)} onChange={(value) => updateField('valor', value)} placeholder="R$ 0,00" value={values.valor} />
              {errors.valor && <div className="invalid-feedback">{errors.valor}</div>}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="faturamento-estoque-inicial">Estoque inicial <span className="required-mark">*</span></label>
              <MoneyInput id="faturamento-estoque-inicial" invalid={Boolean(errors.estoque_inicial)} onChange={(value) => updateField('estoque_inicial', value)} placeholder="R$ 0,00" value={values.estoque_inicial} />
              {errors.estoque_inicial && <div className="invalid-feedback">{errors.estoque_inicial}</div>}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="faturamento-estoque-final">Estoque final <span className="required-mark">*</span></label>
              <MoneyInput id="faturamento-estoque-final" invalid={Boolean(errors.estoque_final)} onChange={(value) => updateField('estoque_final', value)} placeholder="R$ 0,00" value={values.estoque_final} />
              {errors.estoque_final && <div className="invalid-feedback">{errors.estoque_final}</div>}
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
          <div><dt>Empresa</dt><dd>{selectedEmpresa?.razao_social}</dd></div>
          <div><dt>Competência</dt><dd>{selectedCompetencia && competenciaLabel(selectedCompetencia)}</dd></div>
          <div><dt>Categoria</dt><dd>{selectedCategoria?.nome}</dd></div>
          <div><dt>Tipo</dt><dd>{values.tipo_lancamento === 'FATURAMENTO' ? 'Faturamento' : 'Devolução / estorno'}</dd></div>
          <div><dt>Data de referência</dt><dd>{values.data_referencia.split('-').reverse().join('/')}</dd></div>
          <div><dt>Valor</dt><dd>{formatCurrencyFromCents(values.valor)}</dd></div>
          <div><dt>Estoque inicial</dt><dd>{formatCurrencyFromCents(values.estoque_inicial)}</dd></div>
          <div><dt>Estoque final</dt><dd>{formatCurrencyFromCents(values.estoque_final)}</dd></div>
        </dl>
        <div className="alert alert-warning mb-0" role="note">
          Após confirmado, este lançamento não poderá ser editado. Uma correção exigirá cancelamento e substituição.
        </div>
      </ConfirmModal>
    </>
  )
}

export default FaturamentoForm
