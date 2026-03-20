import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';

const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
} as const;

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const Home = lazy(() => import('@/pages/Home'));
const PublicVerify = lazy(() => import('@/pages/PublicVerify'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage'));


export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <ProtectedRoute allowedRoles={['admin', 'client']}><Home /></ProtectedRoute>,
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
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
