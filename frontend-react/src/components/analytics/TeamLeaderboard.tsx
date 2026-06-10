import type { TeamPerformanceData } from '../../types/analytics';
import Card from '../ui/Card';

interface TeamLeaderboardProps {
  data: TeamPerformanceData | null;
}

export default function TeamLeaderboard({ data }: TeamLeaderboardProps) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-950">Bảng xếp hạng đội nhóm</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">Nhân viên</th>
              <th className="py-2">Tin gửi</th>
              <th className="py-2">Chuyển đổi</th>
              <th className="py-2">Lịch hoàn tất</th>
            </tr>
          </thead>
          <tbody>
            {(data?.users ?? []).map((user) => (
              <tr className="border-t border-slate-100" key={user.userId}>
                <td className="py-2 font-medium">{user.fullName}</td>
                <td className="py-2">{user.messagesSent}</td>
                <td className="py-2">{user.contactsConverted}</td>
                <td className="py-2">{user.appointmentsCompleted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
