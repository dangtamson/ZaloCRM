import ProfileEditor from '../../components/profile/ProfileEditor';

export default function PersonalProfilePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-950">Hồ sơ của tôi</h1>
      <ProfileEditor />
    </section>
  );
}
