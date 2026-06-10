import type { Contact } from '../../types/crm';
import Card from '../ui/Card';
import StatusBadge from '../crm/StatusBadge';

interface ContactDetailDialogProps {
  contact: Contact | null;
}

function displayName(contact: Contact): string {
  return contact.name ?? contact.fullName ?? contact.crmName ?? 'Chưa có tên';
}

export default function ContactDetailDialog({ contact }: ContactDetailDialogProps) {
  if (!contact) return null;

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{displayName(contact)}</h2>
          <p className="text-sm text-slate-500">{contact.phone ?? 'Chưa có số điện thoại'}</p>
        </div>
        <StatusBadge tone="blue" value={contact.status} />
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-500">Nguồn</dt>
          <dd className="font-medium text-slate-900">{contact.source ?? '-'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Email</dt>
          <dd className="font-medium text-slate-900">{contact.email ?? '-'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Phụ trách</dt>
          <dd className="font-medium text-slate-900">{contact.assignedUser?.fullName ?? '-'}</dd>
        </div>
      </dl>
    </Card>
  );
}
