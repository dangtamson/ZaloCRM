import { useEffect } from 'react';
import PermissionGroupEditPanel from '../../components/rbac/PermissionGroupEditPanel';
import { useRbacStore } from '../../store/rbac';

export default function PermissionGroupsPage() {
  const groups = useRbacStore((state) => state.permissionGroups);
  const loadPermissionGroups = useRbacStore((state) => state.loadPermissionGroups);

  useEffect(() => {
    void loadPermissionGroups();
  }, [loadPermissionGroups]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-950">Nhóm quyền</h1>
      <div className="grid gap-3">
        {groups.map((group) => (
          <div className="rounded-lg border border-slate-200 bg-white p-4" key={group.id}>
            <h2 className="font-semibold text-slate-950">{group.name}</h2>
            <p className="text-sm text-slate-500">{group.memberCount} thành viên</p>
          </div>
        ))}
      </div>
      <PermissionGroupEditPanel />
    </section>
  );
}
