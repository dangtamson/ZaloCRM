import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SetupForm from '../components/forms/SetupForm';
import { useAuthStore } from '../store/auth';
import type { SetupInput } from '../types/auth';

export default function SetupPage() {
  const setup = useAuthStore((state) => state.setup);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(input: SetupInput): Promise<void> {
    setError('');
    setLoading(true);
    try {
      await setup(input);
      navigate('/', { replace: true });
    } catch {
      setError('Không thể tạo tài khoản đầu tiên.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-950">Setup</h1>
        <p className="text-sm text-slate-600">Tạo tổ chức và tài khoản quản trị đầu tiên.</p>
      </div>
      <SetupForm error={error} loading={loading} onSubmit={handleSubmit} />
    </section>
  );
}
