import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';

const ROUTES = {
  HOME: '/home',
  LOGIN: '/login',
} as const;

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const AdminLoginPage = lazy(() => import('@/pages/AdminLoginPage'));
const MockLogin = lazy(() => import('@/pages/MockLogin'));
const Home = lazy(() => import('@/pages/Home'));
const PublicVerify = lazy(() => import('@/pages/PublicVerify'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage'));
const Index = lazy(() => import('@/pages/Index'));

const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminIndex = lazy(() => import('@/pages/admin/AdminIndex'));
const AdminDegrees = lazy(() => import('@/pages/admin/AdminDegrees'));
const AdminVerify = lazy(() => import('@/pages/admin/AdminVerify'));
const AdminTransactions = lazy(() => import('@/pages/admin/AdminTransactions'));
const AdminStudents = lazy(() => import('@/pages/admin/AdminStudents'));
const AdminContracts = lazy(() => import('@/pages/admin/AdminContracts'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminNetwork = lazy(() => import('@/pages/admin/AdminNetwork'));
const AdminValidators = lazy(() => import('@/pages/admin/AdminValidators'));


export const router = createBrowserRouter([
  {
    path: '/',
    element: <Index />,
    errorElement: <NotFoundPage />,
  },
  {
    path: '/landing',
    element: <Index />,
    errorElement: <NotFoundPage />,
  },
  {
    path: ROUTES.HOME,
    element: <ProtectedRoute allowedRoles={['admin', 'client', 'validator']}><Home /></ProtectedRoute>,
    errorElement: <NotFoundPage />,
  },
  {
    path: '/verify',
    element: <PublicVerify />,
  },
  {
    path: `${ROUTES.LOGIN}/:type?`,
    element: <LoginPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: '/moet-login',
    element: <AdminLoginPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/mock-login',
    element: <MockLogin />,
  },
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['admin', 'moet']}><AdminLayout /></ProtectedRoute>,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <AdminIndex /> },
      { path: 'degrees', element: <AdminDegrees /> },
      { path: 'validators', element: <AdminValidators /> },
      { path: 'verify', element: <AdminVerify /> },
      { path: 'transactions', element: <AdminTransactions /> },
      { path: 'students', element: <AdminStudents /> },
      { path: 'contracts', element: <AdminContracts /> },
      { path: 'settings', element: <AdminSettings /> },
      { path: 'network', element: <AdminNetwork /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
