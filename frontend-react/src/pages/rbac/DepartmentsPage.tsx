import { useEffect } from 'react';
import { useRbacStore } from '../../store/rbac';
import DepartmentEditPanel from '../../components/rbac/DepartmentEditPanel';

export default function DepartmentsPage() {
  const departments = useRbacStore((state) => state.departments);
  const loading = useRbacStore((state) => state.loading);
  const loadDepartments = useRbacStore((state) => state.loadDepartments);

  useEffect(() => {
    void loadDepartments();
  }, [loadDepartments]);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Phòng ban</h1>
        {loading ? <p className="text-sm text-slate-500">Đang tải...</p> : null}
      </div>
      <div className="grid gap-3">
        {departments.map((department) => (
          <div className="rounded-lg border border-slate-200 bg-white p-4" key={department.id}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950">{department.name}</h2>
                <p className="text-sm text-slate-500">{department.path}</p>
              </div>
              <span className="text-sm text-slate-600">{department.memberCount} thành viên</span>
            </div>
          </div>
        ))}
      </div>
      <DepartmentEditPanel />
    </section>
  );
}
