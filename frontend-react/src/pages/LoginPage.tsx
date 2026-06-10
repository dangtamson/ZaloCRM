import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/forms/LoginForm';
import { useAuthStore } from '../store/auth';

export default function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(email: string, password: string): Promise<void> {
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch {
      setError('Email hoặc mật khẩu không đúng.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-950">Login</h1>
        <p className="text-sm text-slate-600">Đăng nhập ZaloCRM.</p>
      </div>
      <LoginForm error={error} loading={loading} onSubmit={handleSubmit} />
    </section>
  );
}
