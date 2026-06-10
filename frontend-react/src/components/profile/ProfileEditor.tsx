import { useAuthStore } from '../../store/auth';
import Card from '../ui/Card';

export default function ProfileEditor() {
  const user = useAuthStore((state) => state.user);

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-950">Thông tin tài khoản</h2>
      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Họ tên</dt>
          <dd className="font-medium text-slate-900">{user?.fullName ?? ''}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Email</dt>
          <dd className="font-medium text-slate-900">{user?.email ?? ''}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Tổ chức</dt>
          <dd className="font-medium text-slate-900">{user?.orgName ?? ''}</dd>
        </div>
      </dl>
    </Card>
  );
}
