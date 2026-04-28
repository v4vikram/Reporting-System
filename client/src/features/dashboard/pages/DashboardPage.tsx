import { useAuthStore } from '../../auth/store/authStore.ts';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Globe, 
  Newspaper, 
  Tv,
  ChevronRight
} from 'lucide-react';
import { CoverageItem } from '../../reports/types/index.ts';
import { formatDistanceToNow } from 'date-fns';
import { useReportStats, useLatestCoverage } from '../../../hooks/useReports.ts';

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: statsData, isLoading: statsLoading } = useReportStats();
  const { data: latestCoverage, isLoading: coverageLoading } = useLatestCoverage(true);

  const stats = [
    { label: 'Total News', value: statsData?.totalNews || 0, icon: FileText, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Online News', value: statsData?.onlineNews || 0, icon: Globe, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Print News', value: statsData?.printNews || 0, icon: Newspaper, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'TV News', value: statsData?.tvNews || 0, icon: Tv, color: 'text-success', bg: 'bg-success/10' },
  ];

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'Online':
        return 'bg-blue-100 text-blue-700';
      case 'Print':
        return 'bg-green-100 text-green-700';
      case 'TV':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div 
      className="-m-8 p-8 min-h-full bg-cover bg-center bg-no-repeat relative"
      style={{ 
        backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop")',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay to ensure readability and match the dark vibe */}
      <div className="absolute inset-0 bg-bg/85 pointer-events-none" />

      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome back, {user?.name}!</h1>
          <p className="text-text-secondary">Here's your media coverage overview.</p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card p-6 rounded-xl border border-border hover:border-accent/50 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-text-secondary text-xs font-medium uppercase tracking-wider">{stat.label}</p>
              {statsLoading ? (
                <div className="h-8 w-16 bg-border animate-pulse rounded mt-1"></div>
              ) : (
                <h3 className="text-2xl font-bold text-text-primary mt-1">{stat.value}</h3>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-accent uppercase tracking-wide">LATEST NEWS COVERAGE</h2>
          <Link to="/news" className="text-xs font-bold text-accent hover:underline flex items-center gap-1 group">
            VIEW ALL <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="space-y-0 divide-y divide-border">
          {coverageLoading ? (
            <div className="py-4 text-center text-text-secondary">Loading latest coverage...</div>
          ) : latestCoverage && latestCoverage.length > 0 ? (
            latestCoverage.map((item: CoverageItem, i: number) => (
              <div key={item.id || item._id || i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <span className={`px-3 py-1 rounded text-xs font-semibold w-16 text-center ${getBadgeStyle(item.type)}`}>
                  {item.type}
                </span>
                <div className="flex-1">
                  {item.link ? (
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm font-semibold text-accent hover:underline line-clamp-1 transition-all"
                    >
                      {item.headline}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold text-text-primary line-clamp-1">{item.headline}</p>
                  )}
                </div>
                <span className="text-xs text-text-secondary whitespace-nowrap">
                  {item.createdAt && !isNaN(new Date(item.createdAt).getTime()) 
                    ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) 
                    : 'Recently'}
                </span>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-text-secondary">No recent coverage found.</div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
