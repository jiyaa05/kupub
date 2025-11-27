// =============================================================================
// App Routes - Figma Design
// =============================================================================

import { BrowserRouter, Routes, Route, Navigate, useParams, Outlet } from 'react-router-dom';
import { AppProviders } from './providers';
import { FullPageSpinner, AdminLayout } from '@/shared/ui';
import { useDepartment } from '@/features/department';
import { AuthProvider, useAuth } from '@/features/auth';

import { lazy, Suspense } from 'react';

// Public pages
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const ReservePage = lazy(() => import('@/pages/ReservePage'));
const MenuPage = lazy(() => import('@/pages/MenuPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const PaymentPage = lazy(() => import('@/pages/PaymentPage'));
const WaitingPage = lazy(() => import('@/pages/WaitingPage'));
const CompletePage = lazy(() => import('@/pages/CompletePage'));
const QRScanPage = lazy(() => import('@/pages/QRScanPage'));
const CodeEntryPage = lazy(() => import('@/pages/CodeEntryPage'));
const KitchenPage = lazy(() => import('@/pages/KitchenPage'));

// Admin pages
const AdminLoginPage = lazy(() => import('@/pages/admin/LoginPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const AdminServiceHubPage = lazy(() => import('@/pages/admin/ServiceHubPage'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/OrdersPage'));
const AdminReservationsPage = lazy(() => import('@/pages/admin/ReservationsPage'));
const AdminMenusPage = lazy(() => import('@/pages/admin/MenusPage'));
const AdminTablesPage = lazy(() => import('@/pages/admin/TablesPage'));
const AdminStatsPage = lazy(() => import('@/pages/admin/StatsPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));
const SuperAdminPage = lazy(() => import('@/pages/admin/SuperAdminPage'));

// -----------------------------------------------------------------------------
// DeptLayout
// -----------------------------------------------------------------------------

function DeptLayout() {
  const { dept } = useParams<{ dept: string }>();

  if (!dept) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-neutral-900">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">잘못된 URL</h1>
          <p className="text-neutral-400">학과 정보가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <AppProviders dept={dept}>
      <DeptContent />
    </AppProviders>
  );
}

function DeptContent() {
  const { isLoading, error } = useDepartment();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-neutral-900">
        <div className="text-center px-4">
          <h1 className="text-xl font-bold mb-2">학과를 찾을 수 없습니다</h1>
          <p className="text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Outlet />
    </Suspense>
  );
}

// -----------------------------------------------------------------------------
// NotFound
// -----------------------------------------------------------------------------

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-neutral-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-orange-400 mb-4">404</h1>
        <p className="text-neutral-400 mb-6">페이지를 찾을 수 없습니다.</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-xl text-neutral-900 hover:bg-stone-200 transition-colors"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// AdminProtectedRoute
// -----------------------------------------------------------------------------

function AdminProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/super-admin" replace />;
  }

  return (
    <Suspense fallback={<FullPageSpinner />}>
      <AdminLayout />
    </Suspense>
  );
}

// -----------------------------------------------------------------------------
// SuperAdminProtectedRoute
// -----------------------------------------------------------------------------

function SuperAdminProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/super-admin/login" replace />;
  }

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-neutral-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">접근 권한 없음</h1>
          <p className="text-neutral-400">총관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<FullPageSpinner />}>
      <SuperAdminPage />
    </Suspense>
  );
}

// -----------------------------------------------------------------------------
// AppRoutes
// -----------------------------------------------------------------------------

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/cs" replace />} />

          <Route path="/:dept" element={<DeptLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="reserve" element={<ReservePage />} />
            <Route path="qr" element={<QRScanPage />} />
            <Route path="code" element={<CodeEntryPage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="payment" element={<PaymentPage />} />
            <Route path="waiting" element={<WaitingPage />} />
            <Route path="complete" element={<CompletePage />} />
            <Route path="kitchen" element={<KitchenPage />} />
          </Route>

          <Route path="/admin/login" element={
            <Suspense fallback={<FullPageSpinner />}>
              <AdminLoginPage />
            </Suspense>
          } />

          <Route path="/super-admin/login" element={
            <Suspense fallback={<FullPageSpinner />}>
              <AdminLoginPage superAdmin />
            </Suspense>
          } />
          
          <Route path="/admin/:dept" element={<AdminProtectedRoute />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="service-hub" element={<AdminServiceHubPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="reservations" element={<AdminReservationsPage />} />
            <Route path="menus" element={<AdminMenusPage />} />
            <Route path="tables" element={<AdminTablesPage />} />
            <Route path="stats" element={<AdminStatsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          <Route path="/super-admin" element={<SuperAdminProtectedRoute />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
