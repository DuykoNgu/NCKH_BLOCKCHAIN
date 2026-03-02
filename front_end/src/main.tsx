import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import "./index.css";
import { Theme } from "@radix-ui/themes";
import { ToastProvider } from "@/components/ui/toast";
import "../configs/pdfWorker";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense>
      <Theme appearance="dark">
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </Theme>
    </Suspense>
  </StrictMode>
);
