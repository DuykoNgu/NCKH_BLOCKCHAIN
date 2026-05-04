import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import "./index.css";
import { WalletProvider } from "@/contexts/WalletContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import "../configs/pdfWorker";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense>
      <AuthProvider>
        <WalletProvider>
          <RouterProvider router={router} />
          <Toaster />
        </WalletProvider>
      </AuthProvider>
    </Suspense>
  </StrictMode>
);
