import * as Toast from "@radix-ui/react-toast";
import { useState } from "react";
import type { ReactNode } from "react";
import { ToastContext, type ToastPayload } from "@/hooks/use-radix-toast";

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const showToast = ({ title, description }: ToastPayload) => {
    setTitle(title);
    setDescription(description ?? "");
    setOpen(false);
    setTimeout(() => setOpen(true), 10);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Toast.Provider swipeDirection="right">
        {children}

        <Toast.Root
          open={open}
          onOpenChange={setOpen}
          className="fixed bottom-4 right-4 w-80 rounded-lg border bg-background p-4 shadow-lg"
        >
          <Toast.Title className="font-semibold">
            {title}
          </Toast.Title>

          {description && (
            <Toast.Description className="text-sm text-muted-foreground">
              {description}
            </Toast.Description>
          )}
        </Toast.Root>

        <Toast.Viewport />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}
