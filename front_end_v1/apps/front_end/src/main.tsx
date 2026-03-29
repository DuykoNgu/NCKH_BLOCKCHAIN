import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import "./index.css";
import { WalletProvider } from "@/context/WalletContext";
import { Toaster } from "@/components/ui/sonner";
import "../configs/pdfWorker";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense>
      <WalletProvider>
        <RouterProvider router={router} />
        <Toaster />
      </WalletProvider>
    </Suspense>
  </StrictMode>
);
