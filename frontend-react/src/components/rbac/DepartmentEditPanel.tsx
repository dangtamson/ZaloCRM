import Card from '../ui/Card';

export default function DepartmentEditPanel() {
  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-950">Chỉnh sửa phòng ban</h2>
      <p className="mt-2 text-sm text-slate-600">Các thao tác tạo, đổi tên, chuyển phòng ban sẽ được port sâu ở bước RBAC chi tiết.</p>
    </Card>
  );
}
