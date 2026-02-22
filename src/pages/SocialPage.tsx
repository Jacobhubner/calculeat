import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { SocialHub } from '@/components/social/SocialHub'
import { ShareDialog } from '@/components/sharing/ShareDialog'
import type { Friend } from '@/lib/types/friends'

export default function SocialPage() {
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<Friend | undefined>(undefined)

  const handleOpenShareDialog = (friend?: Friend) => {
    setSelectedFriend(friend)
    setShareDialogOpen(true)
  }

  const handleShareClose = (open: boolean) => {
    setShareDialogOpen(open)
    if (!open) setSelectedFriend(undefined)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] -mx-3 -my-4 md:-mx-4 md:-my-8 lg:-mx-8">
        <SocialHub onClose={() => {}} onOpenShareDialog={handleOpenShareDialog} />
      </div>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={handleShareClose}
        preselectedFriend={selectedFriend}
      />
    </DashboardLayout>
  )
}
