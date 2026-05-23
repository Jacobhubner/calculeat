import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Drop-in replacement for useMutation that shows an info toast and skips the
 * actual mutationFn when preview mode is active. Centralizes preview isolation
 * so individual hooks don't need scattered guards.
 */
export function usePreviewMutation<TData, TError = Error, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
) {
  const { isPreviewMode } = useAuth()
  const { t } = useTranslation('common')

  return useMutation<TData, TError, TVariables, TContext>({
    ...options,
    mutationFn: isPreviewMode
      ? async () => {
          toast.info(t('preview.mutationBlocked'))
          return null as unknown as TData
        }
      : options.mutationFn,
  })
}
