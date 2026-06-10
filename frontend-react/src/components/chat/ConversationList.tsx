import type { ChatConversation } from '../../types/chat';
import Input from '../ui/Input';

interface ConversationListProps {
  conversations: ChatConversation[];
  selectedId: string;
  loading: boolean;
  onSelect: (conversationId: string) => void;
}

function conversationName(conversation: ChatConversation): string {
  return conversation.groupName ?? conversation.contact?.fullName ?? conversation.contact?.crmName ?? conversation.externalThreadId ?? conversation.id;
}

export default function ConversationList({ conversations, selectedId, loading, onSelect }: ConversationListProps) {
  return (
    <aside className="flex min-h-[620px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-3">
        <Input aria-label="Tìm hội thoại" placeholder="Tìm hội thoại..." />
        {loading ? <p className="mt-2 text-xs text-slate-500">Đang tải...</p> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.length ? conversations.map((conversation) => {
          const active = conversation.id === selectedId;
          return (
            <button
              className={`block w-full border-b border-slate-100 px-3 py-3 text-left hover:bg-slate-50 ${active ? 'bg-blue-50' : ''}`}
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-950">{conversationName(conversation)} · {conversation.contact?.phone ?? conversation.threadType}</div>
                  <div className="mt-1 text-xs text-slate-500">{conversation.lastMessageAt ?? 'Chưa có thời gian'}</div>
                </div>
                {(conversation.unreadCount ?? 0) > 0 ? <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">{conversation.unreadCount}</span> : null}
              </div>
            </button>
          );
        }) : <p className="p-4 text-sm text-slate-500">Chưa có hội thoại.</p>}
      </div>
    </aside>
  );
}
