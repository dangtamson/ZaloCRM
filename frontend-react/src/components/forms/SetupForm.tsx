import { useState, type FormEvent } from 'react';
import type { SetupInput } from '../../types/auth';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface SetupFormProps {
  loading: boolean;
  error: string;
  onSubmit: (input: SetupInput) => Promise<void>;
}

export default function SetupForm({ error, loading, onSubmit }: SetupFormProps) {
  const [form, setForm] = useState<SetupInput>({
    orgName: '',
    fullName: '',
    email: '',
    password: '',
  });

  function update<K extends keyof SetupInput>(key: K, value: SetupInput[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await onSubmit(form);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-1 text-sm font-medium text-slate-700">
        <span>Tên tổ chức / phòng khám</span>
        <Input onChange={(event) => update('orgName', event.target.value)} required value={form.orgName} />
      </label>
      <label className="block space-y-1 text-sm font-medium text-slate-700">
        <span>Họ tên quản trị viên</span>
        <Input onChange={(event) => update('fullName', event.target.value)} required value={form.fullName} />
      </label>
      <label className="block space-y-1 text-sm font-medium text-slate-700">
        <span>Email đăng nhập</span>
        <Input autoComplete="email" onChange={(event) => update('email', event.target.value)} required type="email" value={form.email} />
      </label>
      <label className="block space-y-1 text-sm font-medium text-slate-700">
        <span>Mật khẩu</span>
        <Input autoComplete="new-password" minLength={6} onChange={(event) => update('password', event.target.value)} required type="password" value={form.password} />
      </label>
      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading} type="submit">
        {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
      </Button>
    </form>
  );
}
