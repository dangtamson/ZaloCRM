import { Navigate, Outlet, createBrowserRouter, createMemoryRouter, useLocation, useSearchParams } from 'react-router-dom';
import DefaultLayout from '../layouts/DefaultLayout';
import AuthLayout from '../layouts/AuthLayout';
import MobileLayout from '../layouts/MobileLayout';
import { useMobile } from '../hooks/useMobile';
import { useAuthStore } from '../store/auth';
import AnalyticsPage from '../pages/AnalyticsPage';
import AppointmentsPage from '../pages/crm/AppointmentsPage';
import AutomationPage from '../pages/automation/AutomationPage';
import BlocksPage from '../pages/automation/BlocksPage';
import BotAutoShell from '../pages/automation/BotAutoShell';
import BroadcastsPage from '../pages/automation/BroadcastsPage';
import ChatPage from '../pages/ChatPage';
import CrmTagManagement from '../components/settings/CrmTagManagement';
import ContactProfilePage from '../pages/crm/ContactProfilePage';
import ContactsPage from '../pages/crm/ContactsPage';
import CustomerActivityLogPage from '../pages/crm/CustomerActivityLogPage';
import DashboardPage from '../pages/DashboardPage';
import DepartmentsPage from '../pages/rbac/DepartmentsPage';
import FriendsPage from '../pages/crm/FriendsPage';
import GroupsPage from '../pages/crm/GroupsPage';
import ListDetailPage from '../pages/automation/ListDetailPage';
import ListsPage from '../pages/automation/ListsPage';
import LoginPage from '../pages/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';
import OrgSettings from '../components/settings/OrgSettings';
import PermissionGroupsPage from '../pages/rbac/PermissionGroupsPage';
import PersonalPasswordPage from '../pages/settings/PersonalPasswordPage';
import PersonalProfilePage from '../pages/settings/PersonalProfilePage';
import ProfilePage from '../pages/ProfilePage';
import ReportsPage from '../pages/ReportsPage';
import RouteErrorPage from '../pages/RouteErrorPage';
import SequencesPage from '../pages/automation/SequencesPage';
import SetupPage from '../pages/SetupPage';
import SettingsComingSoon from '../pages/settings/SettingsComingSoon';
import SettingsLayout from '../pages/settings/SettingsLayout';
import StatusManagement from '../components/settings/StatusManagement';
import StuckLeadsPage from '../pages/crm/StuckLeadsPage';
import TriggersPage from '../pages/automation/TriggersPage';
import UsersPage from '../pages/rbac/UsersPage';
import ZaloAccountsPage from '../pages/crm/ZaloAccountsPage';
import ZaloLabelsManagement from '../components/settings/ZaloLabelsManagement';

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
  { path: 'personal/profile', element: <PersonalProfilePage /> },
  { path: 'personal/password', element: <PersonalPasswordPage /> },
  { path: 'personal/notifications', element: <SettingsComingSoon title="Thông báo" /> },
  { path: 'personal/theme', element: <SettingsComingSoon title="Giao diện" /> },
  { path: 'personal/sessions', element: <SettingsComingSoon title="Phiên đăng nhập" /> },
  { path: 'org/profile', element: <OrgSettings /> },
  { path: 'org/billing', element: <SettingsComingSoon title="Thanh toán" /> },
  { path: 'org/audit', element: <SettingsComingSoon title="Audit" /> },
  { path: 'team/users', element: <Navigate replace to="/settings/rbac/users" /> },
  { path: 'team/teams', element: <Navigate replace to="/settings/rbac/departments" /> },
  { path: 'team/roles', element: <Navigate replace to="/settings/rbac/permission-groups" /> },
  { path: 'rbac/departments', element: <DepartmentsPage /> },
  { path: 'rbac/permission-groups', element: <PermissionGroupsPage /> },
  { path: 'rbac/users', element: <UsersPage /> },
  { path: 'privacy', element: <SettingsComingSoon title="Riêng tư" /> },
  { path: 'crm/statuses', element: <StatusManagement /> },
  { path: 'crm/tags', element: <CrmTagManagement /> },
  { path: 'crm/zalo-labels', element: <ZaloLabelsManagement /> },
  { path: 'crm/scoring', element: <SettingsComingSoon title="Settings.Scoring" /> },
  { path: 'crm/stuck', element: <SettingsComingSoon title="KH đình trệ" /> },
  { path: 'crm/folders', element: <SettingsComingSoon title="Thư mục" /> },
  { path: 'crm/templates', element: <SettingsComingSoon title="Mẫu tin" /> },
  { path: 'channels/zalo', element: <SettingsComingSoon title="Tài khoản Zalo" /> },
  { path: 'channels/facebook', element: <SettingsComingSoon title="Facebook" /> },
  { path: 'channels/rate-limit', element: <SettingsComingSoon title="Rate limit" /> },
  { path: 'channels/automation', element: <SettingsComingSoon title="Automation" /> },
  { path: 'channels/integrations', element: <SettingsComingSoon title="Tích hợp" /> },
  { path: 'dev/api', element: <SettingsComingSoon title="API & Webhook" /> },
  { path: 'dev/public-token', element: <SettingsComingSoon title="Public token" /> },
  { path: 'dev/feature-flags', element: <SettingsComingSoon title="Feature flags" /> },
  { path: 'dev/backup', element: <SettingsComingSoon title="Backup" /> },
];

const automationChildren = [
  { index: true, element: <Navigate replace to="/automation/bot/triggers" /> },
  { path: 'triggers', element: <TriggersPage /> },
  { path: 'blocks', element: <BlocksPage /> },
  { path: 'sequences', element: <SequencesPage /> },
  { path: 'broadcasts', element: <BroadcastsPage /> },
  { path: 'lists', element: <ListsPage /> },
  { path: 'lists/:id', element: <ListDetailPage /> },
];

export const appRoutes = [
  {
    element: <AuthRouteLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/setup', element: <SetupPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/chat/:convId?', element: <ChatPage /> },
      { path: '/contacts', element: <ContactsPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/appointments', element: <AppointmentsPage /> },
      { path: '/reports', element: <ReportsPage /> },
      { path: '/analytics', element: <AnalyticsPage /> },
      { path: '/settings/zalo-labels', element: <Navigate replace to="/settings/crm/zalo-labels" /> },
      { path: '/settings/scoring', element: <Navigate replace to="/settings/crm/scoring" /> },
      { path: '/api-settings', element: <Navigate replace to="/settings/dev/api" /> },
      { path: '/integrations', element: <Navigate replace to="/settings/channels/integrations" /> },
      { path: '/zalo-accounts', element: <ZaloAccountsPage /> },
      { path: '/settings', element: <SettingsLayout />, children: settingsChildren },
      { path: '/customers/:id/activity', element: <CustomerActivityLogPage /> },
      { path: '/contacts/:id/profile', element: <ContactProfilePage /> },
      { path: '/leads/stuck', element: <StuckLeadsPage /> },
      { path: '/automation', element: <AutomationPage /> },
      { path: '/automation/bot', element: <BotAutoShell />, children: automationChildren },
      { path: '/groups', element: <GroupsPage /> },
      { path: '/friends', element: <FriendsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage />, errorElement: <RouteErrorPage /> },
];

export function createMemoryAppRouter(initialEntries: string[] = ['/']) {
  return createMemoryRouter(appRoutes, { initialEntries });
}

export const router = createBrowserRouter(appRoutes);
