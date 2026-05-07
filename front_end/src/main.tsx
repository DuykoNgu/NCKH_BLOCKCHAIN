import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "./routes";
import "./index.css";
import { WalletProvider } from "@/contexts/WalletContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import "../configs/pdfWorker";
import "../configs/secp256k1.config";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WalletProvider>
            <RouterProvider router={router} />
            <Toaster />
          </WalletProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Suspense>
  </StrictMode>
);
