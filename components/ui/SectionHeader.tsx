interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="bg-blue-600 text-white rounded-xl p-4 mb-2">
      <h2 className="font-bold text-base">{title}</h2>
      {subtitle && <p className="text-blue-100 text-sm mt-0.5">{subtitle}</p>}
    </div>
  );
}
