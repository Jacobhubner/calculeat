import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Auto-reload on chunk load failures caused by new deployments
    if (error?.message?.includes('Failed to fetch dynamically imported module')) {
      window.location.reload()
      return { hasError: false }
    }
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="rounded-2xl bg-error-100 p-6 mb-6 inline-block">
              <AlertTriangle className="h-12 w-12 text-error-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Något gick fel</h1>
            <p className="text-neutral-600 mb-6">
              Ett oväntat fel inträffade. Försök ladda om sidan eller kontakta support om problemet
              kvarstår.
            </p>
            {this.state.error && (
              <div className="mb-6 p-4 bg-neutral-100 rounded-xl text-left">
                <p className="text-xs font-mono text-neutral-700 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={this.handleReset}>
                Försök igen
              </Button>
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Ladda om sidan
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
