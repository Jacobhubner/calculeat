import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'

interface ToolLayoutProps {
  title: string
  description: string
  category: 'Kroppsanalys' | 'Energi & Metabol' | 'Mål & Planering'
  icon?: LucideIcon
  children: ReactNode
}

const CATEGORY_STYLES = {
  Kroppsanalys: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Energi & Metabol': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Mål & Planering': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
} as const

export default function ToolLayout({
  title,
  description,
  category,
  icon: Icon,
  children,
}: ToolLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-8 w-8 text-primary-600" />}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">{title}</h2>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 mt-1">{description}</p>
        </div>
        <Badge variant="secondary" className={CATEGORY_STYLES[category]}>
          {category}
        </Badge>
      </div>

      {/* Content */}
      {children}
    </div>
  )
}
