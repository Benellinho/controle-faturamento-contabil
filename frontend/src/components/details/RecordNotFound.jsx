function RecordNotFound({ label, onBack }) {
  return (
    <div className="not-found-card">
      <h1>{label} não encontrado.</h1>
      <p>O registro pode não existir ou não estar mais disponível.</p>
      <button className="btn btn-primary" type="button" onClick={onBack}>Voltar para a listagem</button>
    </div>
  )
}

export default RecordNotFound
