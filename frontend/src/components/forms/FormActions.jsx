function FormActions({ isSubmitting, onCancel, submitLabel = 'Salvar', submittingLabel = 'Salvando...' }) {
  return (
    <div className="form-actions">
      <button className="btn btn-outline-secondary" disabled={isSubmitting} type="button" onClick={onCancel}>
        Cancelar
      </button>
      <button className="btn btn-primary" disabled={isSubmitting} type="submit">
        {isSubmitting && <span className="spinner-border spinner-border-sm" aria-hidden="true" />}
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </div>
  )
}

export default FormActions
