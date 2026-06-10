import { useCallback, useMemo, useState } from 'react';
import { fetchContacts } from '../../api/crm';
import ContactColumnToggle from '../../components/contacts/ContactColumnToggle';
import ContactDetailDialog from '../../components/contacts/ContactDetailDialog';
import ContactsTable from '../../components/contacts/ContactsTable';
import DuplicateReviewDialog from '../../components/contacts/DuplicateReviewDialog';
import CrmPageHeader from '../../components/crm/CrmPageHeader';
import DataPanel from '../../components/crm/DataPanel';
import Input from '../../components/ui/Input';
import type { Contact } from '../../types/crm';
import { useCrmResource } from './useCrmResource';

function matches(contact: Contact, query: string): boolean {
  const text = [contact.name, contact.fullName, contact.crmName, contact.phone, contact.email, contact.status].filter(Boolean).join(' ').toLowerCase();
  return text.includes(query.toLowerCase());
}

export default function ContactsPage() {
  const loader = useCallback(() => fetchContacts(), []);
  const { data: contacts, loading, error } = useCrmResource(loader, [] as Contact[]);
  const [query, setQuery] = useState('');
  const [showScore, setShowScore] = useState(true);
  const [selected, setSelected] = useState<Contact | null>(null);

  const filteredContacts = useMemo(() => contacts.filter((contact) => matches(contact, query)), [contacts, query]);

  return (
    <section className="space-y-4">
      <CrmPageHeader description="Quản lý khách hàng, trạng thái CRM, nguồn và điểm lead." meta={`${filteredContacts.length} khách hàng`} title="Contacts" />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input aria-label="Tìm khách hàng" className="sm:max-w-sm" onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, điện thoại, email..." value={query} />
        <ContactColumnToggle onToggleScore={() => setShowScore((value) => !value)} showScore={showScore} />
      </div>
      <DataPanel error={error} loading={loading}>
        <ContactsTable contacts={filteredContacts} onSelect={setSelected} showScore={showScore} />
      </DataPanel>
      <ContactDetailDialog contact={selected} />
      <DuplicateReviewDialog />
    </section>
  );
}
