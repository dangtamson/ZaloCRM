import { Link, NavLink } from 'react-router-dom';
import { Bell, Search, Settings, UserCircle } from 'lucide-react';
import ExtensionSlot from './ExtensionSlot';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';

const primaryTabs = [
  { path: '/', label: 'Dashboard' },
  { path: '/chat', label: 'Tin nhắn' },
  { path: '/friends', label: 'Bạn bè' },
  { path: '/contacts', label: 'Khách hàng' },
  { path: '/leads/stuck', label: 'KH đình trệ' },
  { path: '/appointments', label: 'Lịch hẹn' },
  { path: '/automation/bot/triggers', label: 'Bot-Auto' },
  { path: '/analytics', label: 'Phân tích' },
  { path: '/reports', label: 'Báo cáo' },
];

export default function TopNav() {
  return (
    <header className="sticky top-0 z-20 flex h-[52px] items-center gap-2 border-b border-slate-800 bg-slate-900 px-3 text-white">
      <Link className="rounded-md bg-white px-2 py-1 text-sm font-semibold text-slate-900" to="/">
        ZCRM
      </Link>
      <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {primaryTabs.map((tab) => (
          <NavLink
            className={({ isActive }) =>
              `whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
            key={tab.path}
            to={tab.path}
          >
            {tab.label}
          </NavLink>
        ))}
        <NavLink
          className={({ isActive }) =>
            `inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-medium ${
              isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
          to="/settings/personal/profile"
        >
          <Settings size={14} />
          Cài đặt
        </NavLink>
      </nav>
      <GlobalSearch />
      <ExtensionSlot name="topbar.actions" />
      <NotificationBell />
      <button className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-800" title="Tài khoản" type="button">
        <UserCircle size={18} />
      </button>
    </header>
  );
}

export function TopNavIconSamples() {
  return (
    <div className="hidden">
      <Search />
      <Bell />
    </div>
  );
}
