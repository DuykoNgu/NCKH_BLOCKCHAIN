import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';

const ROUTES = {
  HOME: '/',
  SIGNIN: '/signin',
  SIGNUP: '/signup',
  LOGINPAGE: '/loginpage',
} as const;


const LoginPage = lazy(() => import('@/pages/LoginPage'));
const Home = lazy(() => import('@/pages/Home'));
const ErrorPage = lazy(() => import('@/pages/ErrorPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Root component that checks authentication status
const RootComponent = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  return isLoggedIn ? <Home /> : <Navigate to={ROUTES.SIGNIN} replace />;
};

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <RootComponent />,
    errorElement: <ErrorPage />,
  },
  {
    path: ROUTES.SIGNIN,
    element: <LoginPage />,
    errorElement: <ErrorPage />, 
  },
  {
    path: ROUTES.SIGNUP,
    element: <LoginPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: ROUTES.LOGINPAGE,
    element: <LoginPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);