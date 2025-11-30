import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';

const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
} as const;


const LoginPage = lazy(() => import('@/pages/LoginPage'));
const Home = lazy(() => import('@/pages/Home'));
const ErrorPage = lazy(() => import('@/pages/ErrorPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Root component that checks authentication status
const RootComponent = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  return isLoggedIn ? <Home /> : <Navigate to={`${ROUTES.LOGIN}`} replace />;
};

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <RootComponent />,
    errorElement: <ErrorPage />,
  },
  {
    path: `${ROUTES.LOGIN}/:type?`,
    element: <LoginPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);