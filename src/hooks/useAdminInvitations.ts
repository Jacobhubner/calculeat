import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface AdminInvitation {
  id: string
  sender_id: string
  recipient_id: string
  sender_name: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  responded_at: string | null
}

export function usePendingAdminInvitations() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['adminInvitations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_invitations')
        .select('*')
        .eq('recipient_id', user!.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as AdminInvitation[]
    },
    enabled: !!user,
  })
}

export function usePendingAdminInvitationsCount() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['adminInvitationsCount', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('pending_admin_invitations_count')
      if (error) throw error
      return (data as number) ?? 0
    },
    enabled: !!user,
  })
}

export function useRespondAdminInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ invitationId, accept }: { invitationId: string; accept: boolean }) => {
      const { data, error } = await supabase.rpc('respond_admin_invitation', {
        p_invitation_id: invitationId,
        p_accept: accept,
      })
      if (error) throw error
      return data as { success: boolean; error?: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInvitations'] })
      queryClient.invalidateQueries({ queryKey: ['adminInvitationsCount'] })
      queryClient.invalidateQueries({ queryKey: ['isAdmin'] })
    },
  })
}
