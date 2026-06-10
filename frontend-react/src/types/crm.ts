export interface Contact {
  id: string;
  name?: string | null;
  fullName?: string | null;
  crmName?: string | null;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  status?: string | null;
  leadScore?: number | null;
  tags?: string[];
  assignedUser?: { fullName?: string | null; email?: string | null } | null;
  createdAt?: string | null;
  lastActivity?: string | null;
}

export interface Friend {
  id: string;
  displayName?: string | null;
  zaloDisplayName?: string | null;
  aliasInNick?: string | null;
  phone?: string | null;
  relationshipKind?: string | null;
  friendshipStatus?: string | null;
  leadScore?: number | null;
  totalInbound?: number | null;
  totalOutbound?: number | null;
  contact?: Pick<Contact, 'id' | 'fullName' | 'crmName' | 'phone' | 'leadScore'> | null;
  zaloAccount?: { displayName?: string | null; phone?: string | null } | null;
}

export interface Group {
  id: string;
  name?: string | null;
  groupName?: string | null;
  membersCount?: number | null;
  totalMembers?: number | null;
  ownerName?: string | null;
  lastActivityAt?: string | null;
}

export interface Appointment {
  id: string;
  contactId?: string | null;
  contact?: Pick<Contact, 'id' | 'fullName' | 'name' | 'phone'> | null;
  title?: string | null;
  appointmentDate?: string | null;
  appointmentTime?: string | null;
  type?: string | null;
  status?: string | null;
  notes?: string | null;
  source?: string | null;
}

export interface ZaloAccount {
  id: string;
  displayName?: string | null;
  phone?: string | null;
  status?: string | null;
  avatarUrl?: string | null;
  lastSyncAt?: string | null;
  totalFriends?: number | null;
  totalGroups?: number | null;
}

export interface TimelineItem {
  type?: 'note' | 'activity' | string;
  createdAt?: string | null;
  data?: {
    id?: string;
    action?: string;
    content?: string | null;
    category?: string | null;
    user?: { fullName?: string | null; email?: string | null } | null;
    details?: Record<string, unknown> | null;
  };
}

export interface ContactProfileResponse {
  contact: Contact & {
    displayName?: string | null;
    addressLine?: string | null;
    occupation?: string | null;
    statusName?: string | null;
  };
  friends: Friend[];
  aggregateScore?: number | null;
  aggregateTags?: string[];
  primaryOwner?: { userName?: string | null } | null;
}
