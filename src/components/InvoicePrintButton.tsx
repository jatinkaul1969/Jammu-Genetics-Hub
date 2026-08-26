"use client";

import { Printer } from "lucide-react";

export function InvoicePrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-dark"
    >
      <Printer size={14} /> Print / Save as PDF
    </button>
  );
}
