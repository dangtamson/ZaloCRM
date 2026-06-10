import type { ZaloAccount } from '../../types/crm';
import EmptyState from '../crm/EmptyState';
import StatusBadge from '../crm/StatusBadge';
import Card from '../ui/Card';

interface AccountsTableProps {
  accounts: ZaloAccount[];
  onSelect: (account: ZaloAccount) => void;
}

export default function AccountsTable({ accounts, onSelect }: AccountsTableProps) {
  if (!accounts.length) return <EmptyState label="Chưa có tài khoản Zalo." />;

  return (
    <Card className="overflow-x-auto p-0">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Tài khoản</th>
            <th className="px-4 py-3 font-semibold">Số điện thoại</th>
            <th className="px-4 py-3 font-semibold">Trạng thái</th>
            <th className="px-4 py-3 font-semibold">Dữ liệu</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {accounts.map((account) => (
            <tr className="hover:bg-slate-50" key={account.id}>
              <td className="px-4 py-3">
                <button className="font-medium text-slate-950 hover:text-blue-700" onClick={() => onSelect(account)}>
                  {account.displayName ?? account.id}
                </button>
              </td>
              <td className="px-4 py-3 text-slate-700">{account.phone ?? '-'}</td>
              <td className="px-4 py-3">
                <StatusBadge tone="green" value={account.status} />
              </td>
              <td className="px-4 py-3 text-slate-700">
                {(account.totalFriends ?? 0).toLocaleString()} bạn · {(account.totalGroups ?? 0).toLocaleString()} nhóm
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
