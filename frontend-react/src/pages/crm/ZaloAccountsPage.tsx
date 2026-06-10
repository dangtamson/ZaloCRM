import { useCallback, useState } from 'react';
import { fetchZaloAccounts } from '../../api/crm';
import AccountDetailDrawer from '../../components/zalo-accounts/AccountDetailDrawer';
import AccountsTable from '../../components/zalo-accounts/AccountsTable';
import CrmPageHeader from '../../components/crm/CrmPageHeader';
import DataPanel from '../../components/crm/DataPanel';
import type { ZaloAccount } from '../../types/crm';
import { useCrmResource } from './useCrmResource';

export default function ZaloAccountsPage() {
  const loader = useCallback(() => fetchZaloAccounts(), []);
  const { data: accounts, loading, error } = useCrmResource(loader, [] as ZaloAccount[]);
  const [selected, setSelected] = useState<ZaloAccount | null>(null);

  return (
    <section className="space-y-4">
      <CrmPageHeader description="Kênh Zalo đang kết nối với CRM." meta={`${accounts.length} tài khoản`} title="Tài khoản Zalo" />
      <DataPanel error={error} loading={loading}>
        <AccountsTable accounts={accounts} onSelect={setSelected} />
      </DataPanel>
      <AccountDetailDrawer account={selected} />
    </section>
  );
}
