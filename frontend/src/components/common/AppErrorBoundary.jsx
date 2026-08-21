import { Component } from 'react'

class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  handleReturn = () => {
    window.location.assign('/lancamentos')
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="container py-5" role="alert">
          <div className="alert alert-danger">
            <h1 className="h4">Não foi possível exibir esta tela.</h1>
            <p>Recarregue o fluxo de lançamentos. Se o problema continuar, confira o console para obter os detalhes técnicos.</p>
            <button className="btn btn-outline-danger" type="button" onClick={this.handleReturn}>Voltar para lançamentos</button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

export default AppErrorBoundary
