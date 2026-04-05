export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'primary' }) {
    const colorMap = {
        primary: 'from-primary-400 to-primary-600',
        emerald: 'from-emerald-400 to-emerald-600',
        sky: 'from-sky-400 to-sky-600',
        rose: 'from-rose-400 to-rose-600',
        violet: 'from-violet-400 to-violet-600',
        amber: 'from-amber-400 to-amber-600',
    };

    return (
        <div className="stat-card group hover:scale-[1.02] transition-transform duration-200">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-dark-400 mb-1">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-dark-800">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-dark-400 mt-1">{subtitle}</p>
                    )}
                </div>
                {Icon && (
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[color]} shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                )}
            </div>
        </div>
    );
}
