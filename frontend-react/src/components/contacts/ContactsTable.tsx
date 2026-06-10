import type { Contact } from '../../types/crm';
import EmptyState from '../crm/EmptyState';
import StatusBadge from '../crm/StatusBadge';
import Card from '../ui/Card';

interface ContactsTableProps {
  contacts: Contact[];
  showScore: boolean;
  onSelect: (contact: Contact) => void;
}

function displayName(contact: Contact): string {
  return contact.name ?? contact.fullName ?? contact.crmName ?? 'Chưa có tên';
}

export default function ContactsTable({ contacts, showScore, onSelect }: ContactsTableProps) {
  if (!contacts.length) return <EmptyState label="Chưa có khách hàng phù hợp." />;

  return (
    <Card className="overflow-x-auto p-0">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Khách hàng</th>
            <th className="px-4 py-3 font-semibold">Điện thoại</th>
            <th className="px-4 py-3 font-semibold">Trạng thái</th>
            <th className="px-4 py-3 font-semibold">Nguồn</th>
            {showScore ? <th className="px-4 py-3 font-semibold">Điểm</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {contacts.map((contact) => (
            <tr className="hover:bg-slate-50" key={contact.id}>
              <td className="px-4 py-3">
                <button className="text-left font-medium text-slate-950 hover:text-blue-700" onClick={() => onSelect(contact)}>
                  {displayName(contact)}
                </button>
                {contact.email ? <div className="text-xs text-slate-500">{contact.email}</div> : null}
              </td>
              <td className="px-4 py-3 text-slate-700">{contact.phone ?? '-'}</td>
              <td className="px-4 py-3">
                <StatusBadge tone="blue" value={contact.status} />
              </td>
              <td className="px-4 py-3 text-slate-700">{contact.source ?? '-'}</td>
              {showScore ? <td className="px-4 py-3 font-medium text-slate-900">{contact.leadScore ?? 0}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
