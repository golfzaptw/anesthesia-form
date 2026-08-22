import { Layers } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, icon }: SectionHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-300 shrink-0">
          {icon || <Layers className="w-5 h-5" />}
        </div>
        <div>
          <h2 className="font-bold text-base sm:text-lg leading-snug">{title}</h2>
          {subtitle && (
            <p className="text-slate-300 text-xs sm:text-sm mt-0.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
