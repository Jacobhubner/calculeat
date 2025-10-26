import { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export default function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="group rounded-2xl border bg-white p-6 shadow-lg transition-all duration-200 hover:shadow-xl">
      <div className="mb-4 inline-flex rounded-xl bg-primary-100 p-3 text-primary-600">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-neutral-900">{title}</h3>
      <p className="text-neutral-600">{description}</p>
    </div>
  )
}
