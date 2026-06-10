import { useCallback } from 'react';
import { fetchAppointments } from '../../api/crm';
import AppointmentEditor from '../../components/appointments/AppointmentEditor';
import AppointmentsListView from '../../components/appointments/AppointmentsListView';
import CrmPageHeader from '../../components/crm/CrmPageHeader';
import DataPanel from '../../components/crm/DataPanel';
import type { Appointment } from '../../types/crm';
import { useCrmResource } from './useCrmResource';

export default function AppointmentsPage() {
  const loader = useCallback(() => fetchAppointments(), []);
  const { data: appointments, loading, error } = useCrmResource(loader, [] as Appointment[]);

  return (
    <section className="space-y-4">
      <CrmPageHeader description="Lịch hẹn manual và nhắc hẹn từ Zalo." meta={`${appointments.length} lịch hẹn`} title="Appointments" />
      <DataPanel error={error} loading={loading}>
        <AppointmentsListView appointments={appointments} />
      </DataPanel>
      <AppointmentEditor />
    </section>
  );
}
