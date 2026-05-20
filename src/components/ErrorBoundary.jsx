import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[Alterline] Uncaught error:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen bg-white dark:bg-[#111] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="text-[32px] text-gray-200 dark:text-[#2a2a2a] mb-6 select-none">✦</div>
          <h1 className="text-[18px] font-semibold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-[#555] mb-8">
            An unexpected error occurred. Your entries are safe.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => this.setState({ error: null })}
              className="px-4 py-2 rounded-lg text-[13px] font-medium border border-[#e5e5e5] dark:border-[#2a2a2a] text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] transition-colors"
            >
              Try again
            </button>
            <a
              href="/"
              className="px-4 py-2 rounded-lg text-[13px] font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-80 transition-opacity"
            >
              Go home
            </a>
          </div>
          {import.meta.env.DEV && (
            <pre className="mt-8 text-left text-[11px] text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg p-4 overflow-auto max-h-48">
              {this.state.error.message}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
