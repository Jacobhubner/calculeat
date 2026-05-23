import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export class PreviewBlockedError extends Error {
  readonly isPreviewBlocked = true
  constructor() {
    super('Mutation blocked in preview mode')
    this.name = 'PreviewBlockedError'
  }
}

/**
 * Drop-in replacement for useMutation that throws PreviewBlockedError when
 * preview mode is active. onSuccess never runs; onError receives the error.
 * Consumers can check error.isPreviewBlocked to distinguish from real failures.
 * The wrapper suppresses onError for PreviewBlockedError so consumers don't
 * need to guard individually.
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
          throw new PreviewBlockedError()
        }
      : options.mutationFn,
    onError: (error, variables, context) => {
      if (error instanceof PreviewBlockedError) return
      options.onError?.(error, variables, context)
    },
  })
}
