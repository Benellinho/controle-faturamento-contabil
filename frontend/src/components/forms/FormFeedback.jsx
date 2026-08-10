function FormFeedback({ message, type = 'success' }) {
  if (!message) return null

  return (
    <div className={`alert alert-${type} mb-4`} role={type === 'danger' ? 'alert' : 'status'}>
      {message}
    </div>
  )
}

export default FormFeedback
