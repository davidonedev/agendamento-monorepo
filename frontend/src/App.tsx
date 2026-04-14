import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { PlatformProvider }        from './context/PlatformContext';
import { AuthProvider, useAuth }   from './context/AuthContext';
import { TenantProvider }          from './context/TenantContext';
import { PublicTenantProvider }    from './context/PublicTenantContext';
import { PublicClientProvider }   from './context/PublicClientContext';
import { ProfessionalProvider }    from './context/ProfessionalContext';

// Pages & layouts
import LoginPage             from './pages/LoginPage';
import SignupPage            from './pages/SignupPage';
import SuperLayout           from './components/super/SuperLayout';
import SuperDashboard        from './components/super/SuperDashboard';
import TenantsView           from './components/super/TenantsView';
import TenantDetailView      from './components/super/TenantDetailView';
import PlatformMetricsView   from './components/super/PlatformMetricsView';
import SuperAccountView      from './components/super/SuperAccountView';
import PlansView             from './components/super/PlansView';
import AdminLayout           from './components/layout/AdminLayout';
import ProfessionalLayout    from './components/layout/ProfessionalLayout';
import ClientLayout          from './components/layout/ClientLayout';
import Dashboard             from './components/admin/Dashboard';
import AgendaView            from './components/admin/AgendaView';
import ClientsView           from './components/admin/ClientsView';
import ProfessionalsView     from './components/admin/ProfessionalsView';
import RevenueView           from './components/admin/RevenueView';
import SettingsView          from './components/admin/SettingsView';
import ProfAgendaView        from './components/professional/ProfAgendaView';
import ProfRevenueView       from './components/professional/ProfRevenueView';
import ProfSettingsView      from './components/professional/ProfSettingsView';
import ProfServicesView      from './components/professional/ProfServicesView';
import ServicesView          from './components/admin/ServicesView';
import ProductsView          from './components/admin/ProductsView';
import RemindersView         from './components/admin/RemindersView';
import ServicesPage                from './components/client/ServicesPage';
import BookingFlow                from './components/client/BookingFlow';
import MyAppointments             from './components/client/MyAppointments';
import RegisterPage               from './pages/RegisterPage';
import ProfessionalRegisterPage   from './pages/ProfessionalRegisterPage';
import VerifyEmailPage            from './pages/VerifyEmailPage';

// ─── Route guards ─────────────────────────────────────────────────────────────
function SuperGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user)                       return <Navigate to="/login" replace />;
  if (user.role !== 'super_admin') return <Navigate to="/login" replace />;
  return <PlatformProvider>{children}</PlatformProvider>;
}

function TenantGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user)                        return <Navigate to="/login" replace />;
  if (user.role !== 'tenant_admin') return <Navigate to="/login" replace />;
  return <TenantProvider>{children}</TenantProvider>;
}

function ProfessionalGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user)                        return <Navigate to="/login" replace />;
  if (user.role !== 'professional') return <Navigate to="/login" replace />;
  return <ProfessionalProvider>{children}</ProfessionalProvider>;
}

// ─── App shell ────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route index element={<Navigate to="/login" replace />} />

      {/* Auth */}
      <Route path="login"  element={<LoginPage />} />
      <Route path="signup" element={<SignupPage />} />

      {/* Super admin */}
      <Route path="super" element={<SuperGuard><SuperLayout /></SuperGuard>}>
        <Route index              element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"   element={<SuperDashboard />} />
        <Route path="tenants"     element={<TenantsView />} />
        <Route path="tenants/:tenantId" element={<TenantDetailView />} />
        <Route path="metrics"     element={<PlatformMetricsView />} />
        <Route path="plans"       element={<PlansView />} />
        <Route path="account"     element={<SuperAccountView />} />
      </Route>

      {/* Tenant admin */}
      <Route path="admin" element={<TenantGuard><AdminLayout /></TenantGuard>}>
        <Route index                 element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"      element={<Dashboard />} />
        <Route path="agenda"         element={<AgendaView />} />
        <Route path="clients"        element={<ClientsView />} />
        <Route path="professionals"  element={<ProfessionalsView />} />
        <Route path="services"       element={<ServicesView />} />
        <Route path="products"       element={<ProductsView />} />
        <Route path="reminders"      element={<RemindersView />} />
        <Route path="revenue"        element={<RevenueView />} />
        {/* Minha Conta — subseções */}
        <Route path="account"          element={<SettingsView section="account" />} />
        <Route path="account/portal"   element={<SettingsView section="portal" />} />
        <Route path="account/schedule" element={<SettingsView section="schedule" />} />
        {/* Compatibilidade com rota antiga */}
        <Route path="settings"       element={<SettingsView section="account" />} />
      </Route>

      {/* Professional portal */}
      <Route path="professional" element={<ProfessionalGuard><ProfessionalLayout /></ProfessionalGuard>}>
        <Route index              element={<Navigate to="agenda" replace />} />
        <Route path="agenda"      element={<ProfAgendaView />} />
        <Route path="services"    element={<ProfServicesView />} />
        <Route path="revenue"     element={<ProfRevenueView />} />
        <Route path="settings"    element={<ProfSettingsView />} />
      </Route>

      {/* Public client portal — /:tenantSlug */}
      <Route path=":tenantSlug" element={<PublicTenantProvider><PublicClientProvider><ClientLayout /></PublicClientProvider></PublicTenantProvider>}>
        <Route index                           element={<ServicesPage />} />
        <Route path="booking"                  element={<BookingFlow />} />
        <Route path="register"                 element={<RegisterPage />} />
        <Route path="professional-register"    element={<ProfessionalRegisterPage />} />
        <Route path="my-appointments"          element={<MyAppointments />} />
        <Route path="verify-email"             element={<VerifyEmailPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
    </GoogleOAuthProvider>
  );
}