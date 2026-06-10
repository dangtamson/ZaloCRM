import { Bell } from 'lucide-react';

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  return (
    <button
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-800 ${className}`}
      title="Thông báo"
      type="button"
    >
      <Bell size={17} />
    </button>
  );
}
