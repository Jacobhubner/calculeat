export interface Friend {
  friendship_id: string
  friend_id: string
  friend_name: string // username (COALESCE(username, email))
  friend_email: string
  friend_username: string
  alias: string | null
  since: string
}

export interface FriendRequest {
  friendship_id: string
  requester_id: string
  requester_name: string // username (COALESCE(username, email))
  created_at: string
}

export interface SentFriendRequest {
  friendship_id: string
  addressee_id: string
  addressee_name: string // username (COALESCE(username, email))
  addressee_username: string
  addressee_email: string
  created_at: string
}

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted'
