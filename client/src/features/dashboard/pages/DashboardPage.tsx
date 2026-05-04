import { useAuthStore } from '../../auth/store/authStore.ts';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Globe,
  Newspaper,
  Tv,
  ChevronRight,
  TrendingUp,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { CoverageItem } from '../../reports/types/index.ts';
import { formatDistanceToNow } from 'date-fns';
import { useReportStats, useLatestCoverage } from '../../../hooks/useReports.ts';

/* ─── Skeleton helpers ─────────────────────────────────── */
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-border/60 ${className}`} />
);

/* ─── Badge styles ─────────────────────────────────────── */
const BADGE: Record<string, string> = {
  Online: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
  Print:  'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  TV:     'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30',
};
const getBadgeStyle = (type: string) => BADGE[type] ?? 'bg-muted/15 text-muted-foreground ring-1 ring-border';

/* ─── Stat card data ───────────────────────────────────── */
const STAT_META = [
  { key: 'totalNews',  label: 'Total News',   icon: FileText,  color: 'text-accent',       bg: 'bg-accent/10',       ring: 'ring-accent/20' },
  { key: 'onlineNews', label: 'Online',        icon: Globe,     color: 'text-blue-400',     bg: 'bg-blue-500/10',     ring: 'ring-blue-500/20' },
  { key: 'printNews',  label: 'Print',         icon: Newspaper, color: 'text-orange-400',   bg: 'bg-orange-500/10',   ring: 'ring-orange-500/20' },
  { key: 'tvNews',     label: 'TV',            icon: Tv,        color: 'text-emerald-400',  bg: 'bg-emerald-500/10',  ring: 'ring-emerald-500/20' },
] as const;

/* ═══════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useAuthStore();
  const { data: statsData, isLoading: statsLoading } = useReportStats();
  const { data: latestCoverage, isLoading: coverageLoading } = useLatestCoverage(true);

  return (
    <div
      className="relative -m-8 min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop")',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Scrim */}
      <div className="absolute inset-0 bg-bg/88 backdrop-blur-[2px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 max-w-6xl mx-auto space-y-6 sm:space-y-8">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2"
        >
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-accent/70 mb-0.5">
              Media Intelligence
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary leading-tight">
              Welcome back,{' '}
              <span className="text-accent">{user?.name ?? 'User'}</span>!
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Here's your live media coverage overview.
            </p>
          </div>

          {/* Live pulse indicator */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-text-secondary">Live</span>
          </div>
        </motion.div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {STAT_META.map((s, i) => {
            const value = statsData?.[s.key as keyof typeof statsData] ?? 0;
            return (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                className="group bg-card/80 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-border hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 cursor-default"
              >
                {/* Icon */}
                <div className={`inline-flex p-2.5 rounded-xl ${s.bg} ring-1 ${s.ring} ${s.color} group-hover:scale-110 transition-transform duration-300`}>
                  <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                {/* Value */}
                <div className="mt-3 sm:mt-4">
                  <p className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-text-secondary/70">
                    {s.label}
                  </p>
                  {statsLoading ? (
                    <Skeleton className="h-7 w-14 mt-1.5" />
                  ) : (
                    <motion.p
                      key={String(value)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-2xl sm:text-3xl font-bold text-text-primary mt-1 tabular-nums"
                    >
                      {value.toLocaleString()}
                    </motion.p>
                  )}
                </div>

                {/* Subtle bottom accent bar */}
                <div className={`mt-3 h-0.5 w-8 rounded-full ${s.bg} ${s.color} opacity-60 group-hover:w-full transition-all duration-500`} />
              </motion.div>
            );
          })}
        </div>

        {/* ── Latest Coverage table ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.4 }}
          className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border overflow-hidden"
        >
          {/* Table header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold tracking-widest uppercase text-accent">
                Latest Coverage
              </h2>
            </div>
            <Link
              to="/news"
              className="flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-accent transition-colors group"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Column labels — hidden on mobile */}
          <div className="hidden sm:grid grid-cols-[5rem_1fr_7rem] gap-4 px-6 py-2 bg-border/10 border-b border-border/40">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary/60">Type</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary/60">Headline</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary/60 text-right">When</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border/40">
            <AnimatePresence>
              {coverageLoading ? (
                /* Skeleton rows */
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 sm:px-6 py-4">
                    <Skeleton className="h-6 w-16 shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-20 shrink-0 hidden sm:block" />
                  </div>
                ))
              ) : latestCoverage && latestCoverage.length > 0 ? (
                latestCoverage.map((item: CoverageItem, i: number) => {
                  const timeLabel =
                    item.createdAt && !isNaN(new Date(item.createdAt).getTime())
                      ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
                      : 'Recently';

                  return (
                    <motion.div
                      key={item.id ?? item._id ?? i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group flex flex-col sm:grid sm:grid-cols-[5rem_1fr_7rem] sm:items-center gap-1.5 sm:gap-4 px-5 sm:px-6 py-3.5 sm:py-4 hover:bg-accent/5 transition-colors"
                    >
                      {/* Badge */}
                      <span className={`self-start sm:self-auto inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold tracking-wide w-fit sm:w-full ${getBadgeStyle(item.type)}`}>
                        {item.type}
                      </span>

                      {/* Headline */}
                      <div className="flex items-start gap-1.5 min-w-0">
                        {item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-text-primary hover:text-accent line-clamp-2 sm:line-clamp-1 transition-colors leading-snug flex-1"
                          >
                            {item.headline}
                          </a>
                        ) : (
                          <p className="text-sm font-medium text-text-primary line-clamp-2 sm:line-clamp-1 leading-snug flex-1">
                            {item.headline}
                          </p>
                        )}
                        {item.link && (
                          <ExternalLink className="w-3 h-3 text-text-secondary/40 group-hover:text-accent/60 shrink-0 mt-0.5 transition-colors hidden sm:block" />
                        )}
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-1 sm:justify-end">
                        <Clock className="w-3 h-3 text-text-secondary/40 sm:hidden" />
                        <span className="text-[11px] text-text-secondary/70 whitespace-nowrap">
                          {timeLabel}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-text-secondary text-sm">
                  <Newspaper className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p>No recent coverage found.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </div>
  );
}