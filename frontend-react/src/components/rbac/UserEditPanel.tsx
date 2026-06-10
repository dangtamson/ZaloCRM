import Card from '../ui/Card';

export default function UserEditPanel() {
  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-950">Chỉnh sửa người dùng</h2>
      <p className="mt-2 text-sm text-slate-600">Phân phòng ban và nhóm quyền sẽ dùng API RBAC hiện có.</p>
    </Card>
  );
}
