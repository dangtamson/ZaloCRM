import { Navigate, Outlet, createBrowserRouter, createMemoryRouter, useLocation, useSearchParams } from 'react-router-dom';
import DefaultLayout from '../layouts/DefaultLayout';
import AuthLayout from '../layouts/AuthLayout';
import MobileLayout from '../layouts/MobileLayout';
import { useMobile } from '../hooks/useMobile';
import { useAuthStore } from '../store/auth';
import LoginPage from '../pages/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProfilePage from '../pages/ProfilePage';
import SetupPage from '../pages/SetupPage';

const LEGACY_SETTINGS_TAB_MAP: Record<string, string> = {
  users: '/settings/team/users',
  teams: '/settings/team/teams',
  roles: '/settings/team/roles',
  org: '/settings/org/profile',
  statuses: '/settings/crm/statuses',
  'crm-tags': '/settings/crm/tags',
  'zalo-labels': '/settings/crm/zalo-labels',
  scoring: '/settings/crm/scoring',
};

interface PlaceholderPageProps {
  title: string;
}

function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
      <p className="text-sm text-slate-600">React migration route placeholder.</p>
    </section>
  );
}

function AuthRouteLayout() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
}

function ResponsiveAppLayout() {
  const isMobile = useMobile();
  const Layout = isMobile ? MobileLayout : DefaultLayout;

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function RequireAuth() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <ResponsiveAppLayout />;
}

function SettingsIndexRedirect() {
  const [params] = useSearchParams();
  const legacyTab = params.get('tab');

  if (legacyTab && LEGACY_SETTINGS_TAB_MAP[legacyTab]) {
    return <Navigate replace to={LEGACY_SETTINGS_TAB_MAP[legacyTab]} />;
  }

  return <PlaceholderPage title="Settings.Profile" />;
}

const settingsChildren = [
  { index: true, element: <SettingsIndexRedirect /> },
  { path: 'personal/profile', element: <PlaceholderPage title="Settings.Profile" /> },
  { path: 'personal/password', element: <PlaceholderPage title="Settings.Password" /> },
  { path: 'personal/notifications', element: <PlaceholderPage title="Settings.Notifications" /> },
  { path: 'personal/theme', element: <PlaceholderPage title="Settings.Theme" /> },
  { path: 'personal/sessions', element: <PlaceholderPage title="Settings.Sessions" /> },
  { path: 'org/profile', element: <PlaceholderPage title="Settings.OrgProfile" /> },
  { path: 'org/billing', element: <PlaceholderPage title="Settings.Billing" /> },
  { path: 'org/audit', element: <PlaceholderPage title="Settings.Audit" /> },
  { path: 'team/users', element: <Navigate replace to="/settings/rbac/users" /> },
  { path: 'team/teams', element: <Navigate replace to="/settings/rbac/departments" /> },
  { path: 'team/roles', element: <Navigate replace to="/settings/rbac/permission-groups" /> },
  { path: 'rbac/departments', element: <PlaceholderPage title="Settings.RbacDepartments" /> },
  { path: 'rbac/permission-groups', element: <PlaceholderPage title="Settings.RbacPermissionGroups" /> },
  { path: 'rbac/users', element: <PlaceholderPage title="Settings.RbacUsers" /> },
  { path: 'privacy', element: <PlaceholderPage title="Settings.Privacy" /> },
  { path: 'crm/statuses', element: <PlaceholderPage title="Settings.Statuses" /> },
  { path: 'crm/tags', element: <PlaceholderPage title="Settings.Tags" /> },
  { path: 'crm/zalo-labels', element: <PlaceholderPage title="Settings.ZaloLabels" /> },
  { path: 'crm/scoring', element: <PlaceholderPage title="Settings.Scoring" /> },
  { path: 'crm/stuck', element: <PlaceholderPage title="Settings.Stuck" /> },
  { path: 'crm/folders', element: <PlaceholderPage title="Settings.Folders" /> },
  { path: 'crm/templates', element: <PlaceholderPage title="Settings.Templates" /> },
  { path: 'channels/zalo', element: <PlaceholderPage title="Settings.ZaloAccounts" /> },
  { path: 'channels/facebook', element: <PlaceholderPage title="Settings.Facebook" /> },
  { path: 'channels/rate-limit', element: <PlaceholderPage title="Settings.RateLimit" /> },
  { path: 'channels/automation', element: <PlaceholderPage title="Settings.Automation" /> },
  { path: 'channels/integrations', element: <PlaceholderPage title="Settings.Integrations" /> },
  { path: 'dev/api', element: <PlaceholderPage title="Settings.Api" /> },
  { path: 'dev/public-token', element: <PlaceholderPage title="Settings.PublicToken" /> },
  { path: 'dev/feature-flags', element: <PlaceholderPage title="Settings.FeatureFlags" /> },
  { path: 'dev/backup', element: <PlaceholderPage title="Settings.Backup" /> },
];

const automationChildren = [
  { index: true, element: <Navigate replace to="/automation/bot/triggers" /> },
  { path: 'triggers', element: <PlaceholderPage title="BotAuto.Triggers" /> },
  { path: 'blocks', element: <PlaceholderPage title="BotAuto.Blocks" /> },
  { path: 'sequences', element: <PlaceholderPage title="BotAuto.Sequences" /> },
  { path: 'broadcasts', element: <PlaceholderPage title="BotAuto.Broadcasts" /> },
  { path: 'lists', element: <PlaceholderPage title="BotAuto.Lists" /> },
  { path: 'lists/:id', element: <PlaceholderPage title="BotAuto.ListDetail" /> },
];

export const appRoutes = [
  {
    element: <AuthRouteLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/setup', element: <SetupPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      { path: '/', element: <PlaceholderPage title="Dashboard" /> },
      { path: '/chat/:convId?', element: <PlaceholderPage title="Chat" /> },
      { path: '/contacts', element: <PlaceholderPage title="Contacts" /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/appointments', element: <PlaceholderPage title="Appointments" /> },
      { path: '/reports', element: <PlaceholderPage title="Reports" /> },
      { path: '/analytics', element: <PlaceholderPage title="Analytics" /> },
      { path: '/settings/zalo-labels', element: <Navigate replace to="/settings/crm/zalo-labels" /> },
      { path: '/settings/scoring', element: <Navigate replace to="/settings/crm/scoring" /> },
      { path: '/api-settings', element: <Navigate replace to="/settings/dev/api" /> },
      { path: '/integrations', element: <Navigate replace to="/settings/channels/integrations" /> },
      { path: '/zalo-accounts', element: <Navigate replace to="/settings/channels/zalo" /> },
      { path: '/settings', children: settingsChildren },
      { path: '/customers/:id/activity', element: <PlaceholderPage title="CustomerActivityLog" /> },
      { path: '/contacts/:id/profile', element: <PlaceholderPage title="ContactProfile" /> },
      { path: '/leads/stuck', element: <PlaceholderPage title="StuckLeads" /> },
      { path: '/automation', element: <PlaceholderPage title="Automation" /> },
      { path: '/automation/bot', children: automationChildren },
      { path: '/groups', element: <PlaceholderPage title="Groups" /> },
      { path: '/friends', element: <PlaceholderPage title="Friends" /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];

export function createMemoryAppRouter(initialEntries: string[] = ['/']) {
  return createMemoryRouter(appRoutes, { initialEntries });
}

export const router = createBrowserRouter(appRoutes);
