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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-center gap-4">
        <div className={`rounded-2xl p-3 ${accentClassName}`}>{icon}</div>
        <div>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
    </div>
  );
}
