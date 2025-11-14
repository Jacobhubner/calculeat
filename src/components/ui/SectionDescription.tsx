import { Info } from 'lucide-react'

interface SectionDescriptionProps {
  text: string
  className?: string
}

export default function SectionDescription({ text, className = '' }: SectionDescriptionProps) {
  return (
    <div
      className={`flex gap-3 p-4 mb-4 bg-blue-50 border border-blue-200 rounded-xl ${className}`}
    >
      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-blue-800 leading-relaxed">{text}</p>
    </div>
  )
}
