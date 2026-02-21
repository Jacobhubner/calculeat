export interface Friend {
  friendship_id: string
  friend_id: string
  friend_name: string
  friend_email: string
  alias: string | null
  since: string
}

export interface FriendRequest {
  friendship_id: string
  requester_id: string
  requester_name: string
  created_at: string
}

export interface SentFriendRequest {
  friendship_id: string
  addressee_id: string
  addressee_name: string
  created_at: string
}

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted'
