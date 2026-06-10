import { useState } from 'react';
import type { ChatConversation, ChatMessage } from '../../types/chat';
import { usePrivacyVisibility } from '../../hooks/usePrivacyVisibility';
import RichTextEditor from './rich-text-editor';

interface MessageThreadProps {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  onSend: (content: string) => Promise<void>;
}

function title(conversation: ChatConversation | null): string {
  if (!conversation) return 'Chọn hội thoại';
  return conversation.groupName ?? conversation.contact?.fullName ?? conversation.contact?.crmName ?? conversation.id;
}

export default function MessageThread({ conversation, messages, loading, sending, onSend }: MessageThreadProps) {
  const [draft, setDraft] = useState('');
  const privacy = usePrivacyVisibility();

  async function submit(): Promise<void> {
    const content = draft.trim();
    if (!content) return;
    setDraft('');
    await onSend(content);
  }

  return (
    <section className="flex min-h-[620px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-base font-semibold text-slate-950">{title(conversation)}</h1>
        <p className="text-sm text-slate-500">{conversation?.threadType === 'group' ? `${conversation.groupMembersCount ?? 0} thành viên` : conversation?.contact?.phone ?? 'Tin nhắn CRM'}</p>
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
        {loading ? <p className="text-sm text-slate-500">Đang tải tin nhắn...</p> : null}
        {messages.map((message) => {
          const outgoing = message.senderType === 'self' || message.senderType === 'agent';
          return (
            <div className={`flex ${outgoing ? 'justify-end' : 'justify-start'}`} key={message.id}>
              <div className={`max-w-[72%] rounded-lg px-3 py-2 text-sm ${outgoing ? 'bg-blue-600 text-white' : 'bg-white text-slate-900 shadow-sm'}`}>
                <p>{message.isDeleted ? 'Tin nhắn đã xóa' : privacy.visibleMessageContent(message)}</p>
                <time className={`mt-1 block text-xs ${outgoing ? 'text-blue-100' : 'text-slate-500'}`}>{message.sentAt ?? ''}</time>
              </div>
            </div>
          );
        })}
      </div>
      <footer className="border-t border-slate-200 p-3">
        <RichTextEditor disabled={!conversation || sending} onChange={setDraft} onSubmit={submit} value={draft} />
      </footer>
    </section>
  );
}
