export interface Message {
  id: string
  friendship_id: string
  sender_id: string
  content: string | null
  created_at: string
  read_at: string | null
  edited_at: string | null
  deleted_at: string | null
}

export interface Conversation {
  friendship_id: string
  friend_name: string // username (COALESCE(username, email))
  friend_username: string | null
  friend_alias: string | null
  last_message_content: string | null
  last_message_at: string | null
  last_message_sender_id: string | null
  unread_count: number
}
