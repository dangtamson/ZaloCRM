import { useEffect } from 'react';
import UserEditPanel from '../../components/rbac/UserEditPanel';
import { useRbacStore } from '../../store/rbac';

export default function UsersPage() {
  const users = useRbacStore((state) => state.users);
  const loadUsers = useRbacStore((state) => state.loadUsers);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-950">Người dùng</h1>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Họ tên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Vai trò</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr className="border-t border-slate-100" key={user.id}>
                <td className="px-4 py-3 font-medium">{user.fullName}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <UserEditPanel />
    </section>
  );
}
