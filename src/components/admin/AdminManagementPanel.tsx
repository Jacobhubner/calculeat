/**
 * Adminhantering — lägg till och ta bort admins. Endast superadmin.
 *
 * Låg tidigare bland kontoinställningarna. Flyttad till adminvyn eftersom
 * det hör ihop med de övriga adminverktygen.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { useListAdmins, useAddAdmin, useRemoveAdmin } from '@/hooks/useAdminManagement'

export default function AdminManagementPanel() {
  const { t } = useTranslation('profile')
  const { data: adminList = [] } = useListAdmins()
  const addAdmin = useAddAdmin()
  const removeAdmin = useRemoveAdmin()
  const [newAdminIdentifier, setNewAdminIdentifier] = useState('')

  return (
    <div className="space-y-4">
      {/* Nuvarande admins */}
      <div className="space-y-2">
        {adminList.map(admin => (
          <div
            key={admin.user_id}
            className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700"
          >
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {admin.email}
              </p>
              {admin.is_super_admin && (
                <p className="text-xs text-primary-600 font-medium dark:text-primary-300">
                  {t('settings.superAdminLabel')}
                </p>
              )}
            </div>
            {!admin.is_super_admin && (
              <button
                onClick={async () => {
                  const result = await removeAdmin.mutateAsync(admin.user_id)
                  if (result?.success) {
                    toast.success(t('settings.adminRemoved'))
                  } else {
                    toast.error(t('settings.adminRemoveError'))
                  }
                }}
                disabled={removeAdmin.isPending}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 transition-colors dark:text-neutral-500 dark:hover:text-error-400 dark:hover:bg-error-900/25"
                title={t('settings.adminRemoveTitle')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lägg till admin */}
      <div className="flex gap-2">
        <input
          type="email"
          value={newAdminIdentifier}
          onChange={e => setNewAdminIdentifier(e.target.value)}
          placeholder={t('settings.adminPlaceholder')}
          className="flex-1 px-3 py-2 text-base md:text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
        />
        <button
          onClick={async () => {
            if (!newAdminIdentifier.trim()) return
            const result = await addAdmin.mutateAsync(newAdminIdentifier.trim())
            if (result?.success) {
              toast.success(t('settings.adminAdded'))
              setNewAdminIdentifier('')
            } else if (result?.error === 'user_not_found') {
              toast.error(t('settings.adminNotFound'))
            } else if (result?.error === 'already_admin') {
              toast.info(t('settings.adminAlreadyAdmin'))
            } else if (result?.error === 'invitation_pending') {
              toast.info(t('settings.adminInvitationPending'))
            } else {
              toast.error(t('settings.adminAddError'))
            }
          }}
          disabled={addAdmin.isPending || !newAdminIdentifier.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors shrink-0"
        >
          {addAdmin.isPending ? t('settings.addingAdmin') : t('settings.addAdmin')}
        </button>
      </div>
    </div>
  )
}
