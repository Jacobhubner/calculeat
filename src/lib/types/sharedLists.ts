export interface SharedList {
  id: string
  name: string
  created_at: string
  member_count: number
  // Visningsnamn för varje medlem — för avatar-stack i UI
  member_names: string[]
  food_item_count: number
  recipe_count: number
}

export interface SharedListMember {
  user_id: string
  display_name: string
  joined_at: string
}

export interface SharedListInvitation {
  id: string
  shared_list_id: string
  // Snapshot av listnamnet vid send-tidpunkten
  list_name: string
  sender_name: string
  created_at: string
  status: 'pending' | 'accepted' | 'rejected'
}

// Payload som returneras av leave_shared_list när error = 'last_member'
export interface LastMemberWarning {
  success: false
  error: 'last_member'
  food_item_count: number
  recipe_count: number
}

export type LeaveSharedListResult =
  | { success: true; shared_list_id: string }
  | LastMemberWarning
  | { success: false; error: string }
