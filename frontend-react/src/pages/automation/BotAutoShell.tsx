import { NavLink, Outlet } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

const navItems = [
  { to: '/automation/bot/triggers', label: 'Kịch bản' },
  { to: '/automation/bot/blocks', label: 'Thư viện block' },
  { to: '/automation/bot/sequences', label: 'Chăm sóc' },
  { to: '/automation/bot/broadcasts', label: 'Broadcast' },
  { to: '/automation/bot/lists', label: 'Tệp người dùng' },
];

export default function BotAutoShell() {
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) => twMerge('whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100', isActive && 'bg-blue-50 text-blue-700')}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
