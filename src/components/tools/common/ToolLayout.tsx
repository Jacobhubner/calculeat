import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface ToolLayoutProps {
  title: string;
  description: string;
  category: 'Kroppsanalys' | 'Energi & Metabol' | 'Mål & Planering';
  icon?: LucideIcon;
  children: ReactNode;
}

const CATEGORY_STYLES = {
  'Kroppsanalys': 'bg-green-100 text-green-700',
  'Energi & Metabol': 'bg-orange-100 text-orange-700',
  'Mål & Planering': 'bg-purple-100 text-purple-700',
} as const;

export default function ToolLayout({ title, description, category, icon: Icon, children }: ToolLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-8 w-8 text-primary-600" />}
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          </div>
          <p className="text-neutral-600 mt-1">{description}</p>
        </div>
        <Badge variant="secondary" className={CATEGORY_STYLES[category]}>
          {category}
        </Badge>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
