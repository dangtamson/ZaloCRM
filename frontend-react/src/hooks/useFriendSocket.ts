import { useEffect } from 'react';

export interface FriendUpdatedPayload {
  friendId: string;
  relationshipKind?: string;
}

export function useFriendSocket(_onFriendUpdated?: (payload: FriendUpdatedPayload) => void) {
  useEffect(() => undefined, []);
}
