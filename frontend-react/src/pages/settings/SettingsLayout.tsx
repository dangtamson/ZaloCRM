import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/settings/personal/profile', label: 'Hồ sơ của tôi' },
  { to: '/settings/personal/password', label: 'Mật khẩu' },
  { to: '/settings/org/profile', label: 'Tổ chức' },
  { to: '/settings/rbac/departments', label: 'RBAC: Phòng ban' },
  { to: '/settings/rbac/permission-groups', label: 'RBAC: Nhóm quyền' },
  { to: '/settings/rbac/users', label: 'RBAC: Người dùng' },
  { to: '/settings/crm/tags', label: 'Tag CRM' },
  { to: '/settings/channels/zalo', label: 'Tài khoản Zalo' },
  { to: '/settings/dev/api', label: 'API & Webhook' },
];

export default function SettingsLayout() {
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]" data-testid="settings-layout">
      <aside className="rounded-lg border border-slate-200 bg-white p-3">
        <h1 className="px-3 py-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Cài đặt</h1>
        <nav className="mt-2 grid gap-1">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm ${isActive ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`
              }
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
