export default function ConversationFilterSidebar() {
  return (
    <aside className="hidden min-h-[620px] rounded-lg border border-slate-200 bg-white p-3 shadow-sm xl:block">
      <h2 className="text-sm font-semibold text-slate-950">Inbox</h2>
      <div className="mt-3 space-y-1 text-sm text-slate-600">
        <div className="rounded-md bg-blue-50 px-3 py-2 font-medium text-blue-700">Tất cả</div>
        <div className="px-3 py-2">Chưa đọc</div>
        <div className="px-3 py-2">Cần phản hồi</div>
      </div>
    </aside>
  );
}
