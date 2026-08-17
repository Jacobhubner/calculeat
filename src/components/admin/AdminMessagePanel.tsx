/**
 * Skicka direktmeddelande till en enskild användare. Alla admins.
 *
 * Låg tidigare bland kontoinställningarna. Flyttad till adminvyn eftersom
 * det hör ihop med de övriga adminverktygen.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Loader2, Megaphone } from 'lucide-react'
import { useSendAdminMessage } from '@/hooks/useAdminManagement'

export default function AdminMessagePanel() {
  const { t } = useTranslation('profile')
  const sendAdminMessage = useSendAdminMessage()
  const [adminMsgTo, setAdminMsgTo] = useState('')
  const [adminMsgText, setAdminMsgText] = useState('')

  const handleSend = async () => {
    const to = adminMsgTo.trim()
    const text = adminMsgText.trim()
    if (!to || !text) return
    try {
      const result = await sendAdminMessage.mutateAsync({ identifier: to, text })
      if (!result.success) {
        if (result.error === 'user_not_found') {
          toast.error(t('settings.adminMsgNotFound'))
        } else if (result.error === 'rate_limit') {
          toast.error(t('settings.adminMsgRateLimit'))
        } else {
          toast.error(t('settings.adminMsgError'))
        }
        return
      }
      toast.success(t('settings.adminMsgSent', { user: to }))
      setAdminMsgTo('')
      setAdminMsgText('')
    } catch {
      toast.error(t('settings.adminMsgError'))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('settings.adminMsgDesc')}</p>
      <input
        type="text"
        value={adminMsgTo}
        onChange={e => setAdminMsgTo(e.target.value)}
        placeholder={t('settings.adminMsgToPlaceholder')}
        className="px-3 py-2 text-base md:text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
      />
      <textarea
        value={adminMsgText}
        onChange={e => setAdminMsgText(e.target.value)}
        placeholder={t('settings.adminMsgTextPlaceholder')}
        maxLength={1000}
        rows={3}
        className="px-3 py-2 text-base md:text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
      />
      <button
        onClick={handleSend}
        disabled={sendAdminMessage.isPending || !adminMsgTo.trim() || !adminMsgText.trim()}
        className="self-start inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
      >
        {sendAdminMessage.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Megaphone className="h-4 w-4" />
        )}
        {t('settings.adminMsgSend')}
      </button>
    </div>
  )
}
