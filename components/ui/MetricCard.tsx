interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  accentClassName: string;
}

export function MetricCard({
  title,
  value,
  icon,
  accentClassName,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 sm:p-5">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`shrink-0 rounded-2xl p-2.5 sm:p-3 ${accentClassName}`}>{icon}</div>
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold text-gray-900 sm:text-2xl">{value}</p>
          <p className="line-clamp-2 text-sm text-gray-500">{title}</p>
        </div>
      </div>
    </div>
  );
}
