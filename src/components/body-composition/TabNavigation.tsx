interface TabNavigationProps {
  activeTab: 'method-first' | 'measurements-first'
  onTabChange: (tab: 'method-first' | 'measurements-first') => void
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="mb-6">
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          <button
            onClick={() => onTabChange('method-first')}
            className={`
              whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors
              ${
                activeTab === 'method-first'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
              }
            `}
            aria-current={activeTab === 'method-first' ? 'page' : undefined}
          >
            Välj Metod
          </button>
          <button
            onClick={() => onTabChange('measurements-first')}
            className={`
              whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors
              ${
                activeTab === 'measurements-first'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
              }
            `}
            aria-current={activeTab === 'measurements-first' ? 'page' : undefined}
          >
            Jämför Alla Metoder
          </button>
        </nav>
      </div>
    </div>
  )
}
