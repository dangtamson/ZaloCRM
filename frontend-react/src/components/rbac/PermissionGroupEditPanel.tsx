import Card from '../ui/Card';

export default function PermissionGroupEditPanel() {
  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-950">Chỉnh sửa nhóm quyền</h2>
      <p className="mt-2 text-sm text-slate-600">Matrix quyền dùng chung store RBAC và sẽ được mở rộng ở bước admin chi tiết.</p>
    </Card>
  );
}
