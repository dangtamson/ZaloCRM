import { useState, type FormEvent } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface LoginFormProps {
  loading: boolean;
  error: string;
  onSubmit: (email: string, password: string) => Promise<void>;
}

export default function LoginForm({ error, loading, onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await onSubmit(email, password);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-1 text-sm font-medium text-slate-700">
        <span>Email đăng nhập</span>
        <Input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
      </label>
      <label className="block space-y-1 text-sm font-medium text-slate-700">
        <span>Mật khẩu</span>
        <Input autoComplete="current-password" minLength={6} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
      </label>
      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading} type="submit">
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </Button>
    </form>
  );
}
