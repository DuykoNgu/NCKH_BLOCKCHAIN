import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { ROUTE_PERMISSIONS } from '@/constants/permissions';

const ROUTES = {
  HOME: '/home',
  LOGIN: '/login',
} as const;

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const Home = lazy(() => import('@/pages/Home'));
const PublicVerify = lazy(() => import('@/pages/PublicVerify'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage'));
const Index = lazy(() => import('@/pages/Index'));
const NodeValidatorRegistration = lazy(() => import('@/pages/NodeValidatorRegistration'));

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
const AdminValidatorRegistrations = lazy(() => import('@/pages/admin/AdminValidatorRegistrations'));
const AdminLoginPage = lazy(() => import('@/pages/AdminLoginPage'));


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
    element: (
      <ProtectedRoute allowedRoles={ROUTE_PERMISSIONS['/home']}>
        <Home />
      </ProtectedRoute>
    ),
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
    path: '/register-validator',
    element: <NodeValidatorRegistration />,
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
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={ROUTE_PERMISSIONS['/admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <AdminIndex /> },
      { 
        path: 'degrees', 
        element: (
          <ProtectedRoute allowedRoles={ROUTE_PERMISSIONS['/admin/degrees']}>
            <AdminDegrees />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'verify', 
        element: (
          <ProtectedRoute allowedRoles={ROUTE_PERMISSIONS['/admin/verify']}>
            <AdminVerify />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'transactions', 
        element: (
          <ProtectedRoute allowedRoles={ROUTE_PERMISSIONS['/admin/transactions']}>
            <AdminTransactions />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'students', 
        element: (
          <ProtectedRoute allowedRoles={ROUTE_PERMISSIONS['/admin/students']}>
            <AdminStudents />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'contracts', 
        element: (
          <ProtectedRoute allowedRoles={ROUTE_PERMISSIONS['/admin/contracts']}>
            <AdminContracts />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'settings', 
        element: (
          <ProtectedRoute allowedRoles={ROUTE_PERMISSIONS['/admin/settings']}>
            <AdminSettings />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'network', 
        element: (
          <ProtectedRoute allowedRoles={ROUTE_PERMISSIONS['/admin/network']}>
            <AdminNetwork />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'validators', 
        element: (
          <ProtectedRoute allowedRoles={ROUTE_PERMISSIONS['/admin/validators']}>
            <AdminValidators />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'validator-registrations', 
        element: (
          <ProtectedRoute allowedRoles={ROUTE_PERMISSIONS['/admin/validators']}>
            <AdminValidatorRegistrations />
          </ProtectedRoute>
        ) 
      },
      { path: '*', element: <Navigate to="/admin" replace /> }
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
