import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy, Suspense, useMemo } from "react";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/context/WalletContext";
// ================== CONSTANTS ==================
const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  VERIFY: "/verify",
  DASHBOARD: "/dashboard",
  UNAUTHORIZED: "/unauthorized",
} as const;

// ================== LAZY PAGES ==================
const Index = lazy(() => import("@/pages/Index"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const Home = lazy(() => import("@/pages/Home"));
const PublicVerify = lazy(() => import("@/pages/PublicVerify"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const UnauthorizedPage = lazy(() => import("@/pages/UnauthorizedPage"));

// ================== GLOBAL CLIENT ==================
const queryClient = new QueryClient();

// ================== APP ==================
export default function App() {
  // ✅ Router chỉ tạo 1 lần
  const router = useMemo(
    () =>
      createBrowserRouter([
        // Public
        {
          path: ROUTES.HOME,
          element: <Index />,
          errorElement: <NotFoundPage />,
        },
        {
          path: ROUTES.VERIFY,
          element: <PublicVerify />,
        },
        {
          path: `${ROUTES.LOGIN}/:type?`,
          element: <LoginPage />,
        },

        // Private
        {
          element: <ProtectedRoute allowedRoles={["admin", "client"]} />,
          children: [
            {
              path: ROUTES.DASHBOARD,
              element: <Home />,
            },
          ],
        },

        // Others
        {
          path: ROUTES.UNAUTHORIZED,
          element: <UnauthorizedPage />,
        },
        {
          path: "*",
          element: <NotFoundPage />,
        },
      ]),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <Suspense fallback={<div>Loading...</div>}>
            <RouterProvider router={router} />
          </Suspense>
        </TooltipProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}
