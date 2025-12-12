import { LucideIcon } from 'lucide-react';

export type NavItemType = 'single' | 'group';

export interface SingleNavItem {
  type: 'single';
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export interface GroupNavItem {
  type: 'group';
  label: string;
  icon: LucideIcon;
  children: Array<{
    to: string;
    label: string;
    icon: LucideIcon;
    category?: string; // Kroppsanalys, Energi & Metabol, Mål & Planering
  }>;
}

export type NavItem = SingleNavItem | GroupNavItem;
