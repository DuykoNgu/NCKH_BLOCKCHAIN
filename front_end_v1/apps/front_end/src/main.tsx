import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import "./index.css";
import { ToastProvider } from "@/components/ui/toast";
import { WalletProvider } from "@/context/WalletContext";
import "../configs/pdfWorker";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense>
      <WalletProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </WalletProvider>
    </Suspense>
  </StrictMode>
);
