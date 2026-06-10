import type { ChatConversation } from '../../types/chat';

interface ChatContactPanelProps {
  conversation: ChatConversation | null;
}

export default function ChatContactPanel({ conversation }: ChatContactPanelProps) {
  if (!conversation?.contact) return null;

  return (
    <aside className="hidden min-h-[620px] rounded-lg border border-slate-200 bg-white p-4 shadow-sm 2xl:block">
      <h2 className="text-sm font-semibold text-slate-950">Hồ sơ khách hàng</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-slate-500">Tên</dt>
          <dd className="font-medium text-slate-950">Tên: {conversation.contact.fullName ?? conversation.contact.crmName ?? '-'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Điện thoại</dt>
          <dd className="font-medium text-slate-950">SĐT: {conversation.contact.phone ?? '-'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Trạng thái</dt>
          <dd className="font-medium text-slate-950">{conversation.contact.status ?? '-'}</dd>
        </div>
      </dl>
    </aside>
  );
}
