export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  onClick 
}) {
  const colorMap = {
    primary: {
      bg: 'bg-primary-50',
      icon: 'text-primary-800',
      border: 'border-primary-100',
      gradient: 'from-primary-500/10 to-primary-800/5',
    },
    success: {
      bg: 'bg-success-light',
      icon: 'text-success',
      border: 'border-success/20',
      gradient: 'from-success/10 to-success/5',
    },
    warning: {
      bg: 'bg-warning-light',
      icon: 'text-warning',
      border: 'border-warning/20',
      gradient: 'from-warning/10 to-warning/5',
    },
    info: {
      bg: 'bg-info-light',
      icon: 'text-info',
      border: 'border-info/20',
      gradient: 'from-info/10 to-info/5',
    },
    danger: {
      bg: 'bg-danger-light',
      icon: 'text-danger',
      border: 'border-danger/20',
      gradient: 'from-danger/10 to-danger/5',
    },
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <div
      onClick={onClick}
      className={`
        card-premium p-4 cursor-pointer group h-full
        bg-gradient-to-br ${colors.gradient}
        hover:shadow-medium transform hover:-translate-y-0.5
        transition-all duration-300 flex flex-col justify-between
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
      </div>
      
      <div>
        <p className="text-2xl font-bold text-gray-900 mb-1 group-hover:scale-105 transition-transform">
          {value}
        </p>
        <p className="text-xs text-gray-500 font-medium leading-tight">
          {title}
        </p>
      </div>

      {/* Mini gráfico decorativo */}
      <div className="mt-3 flex items-end gap-0.5 h-6">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm ${colors.bg} opacity-40`}
            style={{ height: `${20 + Math.random() * 80}%` }}
          />
        ))}
      </div>
    </div>
  );
}