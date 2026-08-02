import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import i18n from '@/i18n'

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

  static isChunkError(error: Error): boolean {
    const msg = error?.message ?? ''
    return (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('is not a valid JavaScript MIME type') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('error loading dynamically imported module')
    )
  }

  static getDerivedStateFromError(error: Error): State {
    if (ErrorBoundary.isChunkError(error)) {
      sessionStorage.removeItem('chunk-reload')
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-900">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="rounded-2xl bg-error-100 p-6 mb-6 inline-block dark:bg-error-900/25">
              <AlertTriangle className="h-12 w-12 text-error-600 dark:text-error-300" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2 dark:text-neutral-100">
              {i18n.t('common:errorBoundary.title')}
            </h1>
            <p className="text-neutral-600 mb-6 dark:text-neutral-400">
              {i18n.t('common:errorBoundary.description')}
            </p>
            {this.state.error && (
              <div className="mb-6 p-4 bg-neutral-100 rounded-xl text-left dark:bg-neutral-800">
                <p className="text-xs font-mono text-neutral-700 break-all dark:text-neutral-200">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={this.handleReset}>
                {i18n.t('common:errorBoundary.tryAgain')}
              </Button>
              <Button
                onClick={() => {
                  sessionStorage.removeItem('chunk-reload')
                  window.location.reload()
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {i18n.t('common:status.reloadPage')}
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
