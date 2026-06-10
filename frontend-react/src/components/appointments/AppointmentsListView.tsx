import type { Appointment } from '../../types/crm';
import EmptyState from '../crm/EmptyState';
import StatusBadge from '../crm/StatusBadge';
import Card from '../ui/Card';

interface AppointmentsListViewProps {
  appointments: Appointment[];
}

function contactName(appointment: Appointment): string {
  return appointment.contact?.name ?? appointment.contact?.fullName ?? appointment.contact?.phone ?? appointment.contactId ?? '-';
}

export default function AppointmentsListView({ appointments }: AppointmentsListViewProps) {
  if (!appointments.length) return <EmptyState label="Chưa có lịch hẹn." />;

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => (
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" key={appointment.id}>
          <div>
            <h2 className="font-semibold text-slate-950">{appointment.title ?? contactName(appointment)}</h2>
            <p className="text-sm text-slate-600">
              {[appointment.appointmentDate, appointment.appointmentTime].filter(Boolean).join(' ') || 'Chưa có thời gian'}
            </p>
            {appointment.notes ? <p className="mt-1 text-sm text-slate-500">{appointment.notes}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="orange" value={appointment.type} />
            <StatusBadge tone="blue" value={appointment.status} />
          </div>
        </Card>
      ))}
    </div>
  );
}
