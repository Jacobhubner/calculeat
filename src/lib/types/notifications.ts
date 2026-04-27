export type NotificationType =
  | 'friend_request_received'
  | 'friend_request_accepted'
  | 'shared_list_invitation_received'
  | 'shared_list_member_left'
  | 'new_message'

export interface Notification {
  id: string
  actor_id: string | null
  actor_name: string | null
  type: NotificationType
  entity_type: string | null
  entity_id: string | null
  title: string
  body: string | null
  read_at: string | null
  created_at: string
  metadata: Record<string, unknown> | null
}
