import ProfileEditor from '../components/profile/ProfileEditor';
import PasswordForm from '../components/profile/PasswordForm';

export default function ProfilePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-950">Profile</h1>
      <ProfileEditor />
      <PasswordForm />
    </section>
  );
}
