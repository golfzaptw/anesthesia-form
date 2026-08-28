"use client";

import { useState } from "react";
import { SystemInfoModal } from "./SystemInfoModal";
import { Info } from "lucide-react";

export function Footer({ className = "" }: { className?: string }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <footer className={`py-6 px-4 text-center text-xs text-slate-400 font-light ${className}`}>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>© 2026 Anesthesia Evaluation Platform</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span>
            Developed by{" "}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="text-slate-500 hover:text-blue-600 font-medium transition-colors inline-flex items-center gap-1 group underline-offset-2 hover:underline"
            >
              <span>Chutikan Sangsup</span>
              <Info className="w-3 h-3 opacity-60 group-hover:opacity-100 text-blue-500" />
            </button>
          </span>
        </div>
      </footer>

      <SystemInfoModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
