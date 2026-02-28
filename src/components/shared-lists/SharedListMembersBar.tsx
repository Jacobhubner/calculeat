import { useState } from 'react'
import { UserPlus, MoreHorizontal, LogOut, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { InviteToSharedListDialog } from './InviteToSharedListDialog'
import {
  useLeaveSharedList,
  useLeaveSharedListConfirmed,
  useRenameSharedList,
} from '@/hooks/useSharedLists'
import { toast } from 'sonner'
import type { SharedList, LastMemberWarning } from '@/lib/types/sharedLists'
import { Input } from '@/components/ui/input'

interface SharedListMembersBarProps {
  list: SharedList
  onLeft: () => void // Callback när listan lämnas → byt tillbaka till 'mina'-tabb
}

const MAX_VISIBLE_AVATARS = 3

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// Avatar-färger baserade på namn (deterministisk)
const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-yellow-100 text-yellow-700',
]

function getAvatarColor(name: string) {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function SharedListMembersBar({ list, onLeft }: SharedListMembersBarProps) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [lastMemberWarning, setLastMemberWarning] = useState<LastMemberWarning | null>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [newName, setNewName] = useState(list.name)

  const { mutateAsync: leaveList, isPending: isLeaving } = useLeaveSharedList()
  const { mutateAsync: leaveConfirmed, isPending: isLeavingConfirmed } =
    useLeaveSharedListConfirmed()
  const { mutateAsync: renameList, isPending: isRenaming } = useRenameSharedList()

  const visibleMembers = list.member_names.slice(0, MAX_VISIBLE_AVATARS)
  const overflowCount = list.member_names.length - MAX_VISIBLE_AVATARS

  async function handleLeave() {
    const result = await leaveList(list.id)

    if (result.success) {
      toast.success(`Du har lämnat "${list.name}"`)
      onLeft()
    } else if (result.error === 'last_member') {
      // Stäng confirm-dialogen och visa last-member-varning
      setLeaveOpen(false)
      setLastMemberWarning(result as LastMemberWarning)
    } else {
      toast.error('Kunde inte lämna listan. Försök igen.')
    }
  }

  async function handleLeaveConfirmed() {
    const result = await leaveConfirmed(list.id)

    if (result?.success) {
      toast.success(`Listan "${list.name}" raderades`)
      onLeft()
    } else {
      toast.error('Kunde inte radera listan. Försök igen.')
    }
    setLastMemberWarning(null)
  }

  async function handleRename() {
    if (!newName.trim() || newName.trim() === list.name) {
      setRenameOpen(false)
      return
    }

    const result = await renameList({ sharedListId: list.id, name: newName.trim() })
    if (result?.success) {
      toast.success('Listnamnet uppdaterades')
    } else {
      toast.error('Kunde inte byta namn. Försök igen.')
    }
    setRenameOpen(false)
  }

  return (
    <>
      <div className="flex items-center gap-3 px-1 py-2 border-b">
        {/* Avatar-stack */}
        <div className="flex -space-x-2">
          {visibleMembers.map(name => (
            <div
              key={name}
              title={name}
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-background text-xs font-semibold ${getAvatarColor(name)}`}
            >
              {getInitials(name)}
            </div>
          ))}
          {overflowCount > 0 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold text-muted-foreground">
              +{overflowCount}
            </div>
          )}
        </div>

        {/* Listnamn */}
        <span className="text-sm text-muted-foreground flex-1 min-w-0 truncate">
          {list.member_count} {list.member_count === 1 ? 'deltagare' : 'deltagare'}
        </span>

        {/* Bjud in */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setInviteOpen(true)}
          className="gap-1.5 text-xs h-7"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Bjud in
        </Button>

        {/* Mer-meny */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setNewName(list.name)
                setRenameOpen(true)
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Byt namn
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLeaveOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Lämna lista
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Inbjudan-dialog */}
      <InviteToSharedListDialog open={inviteOpen} onOpenChange={setInviteOpen} list={list} />

      {/* Lämna lista — vanlig confirm */}
      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lämna &quot;{list.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Du förlorar åtkomsten till listan och kan bara komma tillbaka om en annan deltagare
              bjuder in dig igen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              disabled={isLeaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLeaving ? 'Lämnar...' : 'Lämna lista'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lämna lista — sista medlemmen (allt raderas) */}
      <AlertDialog open={!!lastMemberWarning} onOpenChange={() => setLastMemberWarning(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Du är sista deltagaren</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Om du lämnar raderas listan <strong>&quot;{list.name}&quot;</strong> permanent
                  tillsammans med allt dess innehåll:
                </p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {(lastMemberWarning?.food_item_count ?? 0) > 0 && (
                    <li>{lastMemberWarning?.food_item_count} livsmedel</li>
                  )}
                  {(lastMemberWarning?.recipe_count ?? 0) > 0 && (
                    <li>{lastMemberWarning?.recipe_count} recept</li>
                  )}
                </ul>
                <p className="font-medium text-destructive">Det går inte att ångra.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveConfirmed}
              disabled={isLeavingConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLeavingConfirmed ? 'Raderar...' : 'Lämna och radera listan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Byt namn-dialog */}
      <AlertDialog open={renameOpen} onOpenChange={setRenameOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Byt namn på listan</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleRename} disabled={!newName.trim() || isRenaming}>
              {isRenaming ? 'Sparar...' : 'Spara'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
