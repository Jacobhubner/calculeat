export interface SupportThread {
  id: string
  user_id: string
  assigned_admin_id: string | null
  status: 'open' | 'closed'
  created_at: string
  updated_at: string
}

export interface SupportMessage {
  id: string
  sender_id: string
  sender_username: string
  content: string | null // null when deleted_at is set
  original_content: string | null
  image_path: string | null // storage-path i 'support-attachments'; null när deleted_at är satt
  created_at: string
  read_at: string | null
  deleted_at: string | null
  edited_at: string | null
}

export interface SupportInboxEntry {
  thread_id: string
  user_id: string
  username: string
  email: string
  assigned_admin_id: string | null
  assigned_admin_username: string | null
  status: 'open' | 'closed'
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  updated_at: string
  created_at: string
}

export type SupportRpcResult =
  | { success: true; message_id: string; thread_id?: string }
  | { success: false; error: string }
