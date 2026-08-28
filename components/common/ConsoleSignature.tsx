"use client";

import { useEffect } from "react";

export function ConsoleSignature() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log(
        "%c 💉 Anesthesia Evaluation Platform %c Developed by Chutikan Sangsup ",
        "background: #2563eb; color: #ffffff; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: bold; font-size: 11px;",
        "background: #0f172a; color: #38bdf8; padding: 4px 8px; border-radius: 0 4px 4px 0; font-weight: bold; font-size: 11px;"
      );
      console.log(
        "%c Nurse Anesthesia • Phramongkutklao Hospital %c Version 1.0.0 • 2026 ",
        "color: #64748b; font-size: 10px;",
        "color: #94a3b8; font-size: 10px; font-style: italic;"
      );
    }
  }, []);

  return null;
}
