import { useUpgradeModalStore } from '@/stores/upgradeModalStore'
import { UpgradeModal } from './UpgradeModal'

/**
 * Monteras en gång i App. Öppnas via useUpgradeModalStore /
 * handlePremiumLimitError när en servertrigger avvisar med kvotfel.
 */
export function GlobalUpgradeModal() {
  const { isOpen, limitKey, close } = useUpgradeModalStore()
  return <UpgradeModal open={isOpen} onOpenChange={open => !open && close()} limitKey={limitKey} />
}
