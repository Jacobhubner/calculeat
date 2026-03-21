import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface AdminEntry {
  user_id: string
  email: string
  is_super_admin: boolean
  created_at: string
}

export function useIsSuperAdmin() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['isSuperAdmin', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('admins')
        .select('is_super_admin')
        .eq('user_id', user!.id)
        .maybeSingle()
      return !!data?.is_super_admin
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })
}

export function useListAdmins() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['adminList'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_admins')
      if (error) throw error
      return data as AdminEntry[]
    },
    enabled: !!user,
  })
}

export function useAddAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (identifier: string) => {
      const { data, error } = await supabase.rpc('add_admin', { p_identifier: identifier })
      if (error) throw error
      return data as { success: boolean; error?: string }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminList'] }),
  })
}

export function useRemoveAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc('remove_admin', { p_user_id: userId })
      if (error) throw error
      return data as { success: boolean; error?: string }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminList'] }),
  })
}
