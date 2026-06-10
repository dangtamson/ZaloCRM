import type { ZaloAccount } from '../../types/crm';
import Card from '../ui/Card';

interface AccountDetailDrawerProps {
  account: ZaloAccount | null;
}

export default function AccountDetailDrawer({ account }: AccountDetailDrawerProps) {
  if (!account) return null;

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-950">{account.displayName ?? account.id}</h2>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-500">Điện thoại</dt>
          <dd className="font-medium text-slate-900">{account.phone ?? '-'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Đồng bộ cuối</dt>
          <dd className="font-medium text-slate-900">{account.lastSyncAt ?? '-'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Trạng thái</dt>
          <dd className="font-medium text-slate-900">{account.status ?? '-'}</dd>
        </div>
      </dl>
    </Card>
  );
}
