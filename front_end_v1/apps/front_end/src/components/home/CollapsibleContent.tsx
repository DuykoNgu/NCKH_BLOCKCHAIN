import React, { useState } from "react";

interface CollapsibleContentProps {
  title: string;
  children: React.ReactNode;
}

export const CollapsibleContent = ({ title, children }: CollapsibleContentProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full max-w-[1000px] border rounded-lg overflow-hidden">
      {/* HEADER */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="glass-card w-full h-15 px-4 py-3 bg-muted hover:bg-muted/80 transition flex items-center justify-between"
      >
        <span className="font-medium">{title}</span>
        <div
          className={`h-5 w-5 transition-transform duration-300  ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* COLLAPSE CONTENT */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          open ? "max-h-[1200px]" : "max-h-0"
        }`}
      >
        <div className="p-4 flex flex-col items-center gap-4">
          {children}
        </div>
      </div>
    </div>
  );
};