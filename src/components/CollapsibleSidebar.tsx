/**
 * CollapsibleSidebar - Wrapper component for collapsible sidebar functionality
 */

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSidebarProps {
  children: React.ReactNode
  className?: string
}

export default function CollapsibleSidebar({ children, className }: CollapsibleSidebarProps) {
  // Initialize state from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    return saved === 'true'
  })

  // Save collapsed state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed))
  }, [isCollapsed])

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev)
  }

  return (
    <div
      className={cn(
        'relative transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-12' : 'w-full',
        className
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleCollapse}
        className={cn(
          'absolute top-0 z-50 p-2 bg-white border border-neutral-200 rounded-lg shadow-sm hover:shadow-md hover:bg-neutral-50 transition-all',
          isCollapsed ? 'left-1' : 'right-1'
        )}
        title={isCollapsed ? 'Expandera sidopanel' : 'Minimera sidopanel'}
      >
        {isCollapsed ? (
          <ChevronLeft className="h-4 w-4 text-neutral-600" />
        ) : (
          <ChevronRight className="h-4 w-4 text-neutral-600" />
        )}
      </button>

      {/* Sidebar Content */}
      <div
        className={cn(
          'transition-opacity duration-300',
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
      >
        {children}
      </div>

      {/* Collapsed State Indicator */}
      {isCollapsed && (
        <div className="absolute left-1/2 top-20 -translate-x-1/2 rotate-90 whitespace-nowrap">
          <span className="text-xs font-medium text-neutral-500">Info</span>
        </div>
      )}
    </div>
  )
}
