import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface BackToHubButtonProps {
  hubPath: string
  hubLabel: string
}

export function BackToHubButton({ hubPath, hubLabel }: BackToHubButtonProps) {
  const navigate = useNavigate()

  return (
    <Button variant="ghost" size="sm" onClick={() => navigate(hubPath)} className="mb-4">
      <ArrowLeft className="h-4 w-4 mr-2" />
      Tillbaka till {hubLabel}
    </Button>
  )
}
