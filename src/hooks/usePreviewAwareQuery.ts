import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Drop-in replacement for useQuery that returns emptyValue when preview mode is active.
 * Centralizes preview isolation so individual hooks don't need scattered guards.
 */
export function usePreviewAwareQuery<T>(
  options: Omit<UseQueryOptions<T>, 'queryFn'> & {
    queryFn: () => Promise<T>
    emptyValue: T
  }
) {
  const { isPreviewMode } = useAuth()
  const { emptyValue, ...queryOptions } = options

  return useQuery<T>({
    ...queryOptions,
    queryFn: isPreviewMode ? async () => emptyValue : options.queryFn,
  })
}
