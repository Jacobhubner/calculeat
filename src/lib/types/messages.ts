export interface Message {
  id: string
  friendship_id: string
  sender_id: string
  content: string | null
  /** Första bilden — behålls för bakåtkompatibilitet, använd image_paths */
  image_path: string | null
  /** Alla bilagor i vald ordning (max 5). null när meddelandet saknar bild. */
  image_paths: string[] | null
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
  /** True när senaste meddelandet har en bild — listan visar "Bild" i stället för tomt */
  last_message_has_image: boolean
  last_message_at: string | null
  last_message_sender_id: string | null
  unread_count: number
}
