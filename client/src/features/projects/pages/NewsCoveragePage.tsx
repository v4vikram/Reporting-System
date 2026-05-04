import React from 'react';
import { CoverageItem } from '../../reports/types/index.ts';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, Globe, Tv, ExternalLink, Clock, Star, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLatestCoverage } from '../../../hooks/useReports.ts';

/* ─── Helpers ───────────────────────────────────────────── */
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-border/60 ${className}`} />
);

const TYPE_CONFIG: Record<string, { badge: string; icon: React.ReactNode; dot: string }> = {
  Online: {
    badge: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
    icon: <Globe className="w-4 h-4 text-blue-400" />,
    dot: 'bg-blue-400',
  },
  Print: {
    badge: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
    icon: <Newspaper className="w-4 h-4 text-emerald-400" />,
    dot: 'bg-emerald-400',
  },
  TV: {
    badge: 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30',
    icon: <Tv className="w-4 h-4 text-orange-400" />,
    dot: 'bg-orange-400',
  },
};

const getConfig = (type: string) =>
  TYPE_CONFIG[type] ?? {
    badge: 'bg-muted/15 text-muted-foreground ring-1 ring-border',
    icon: <Newspaper className="w-4 h-4 text-text-secondary" />,
    dot: 'bg-border',
  };

/* ─── Card view (mobile) ───────────────────────────────── */
function CoverageCard({ item, index }: { item: CoverageItem; index: number }) {
  const cfg = getConfig(item.type);
  const timeLabel =
    item.createdAt && !isNaN(new Date(item.createdAt).getTime())
      ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
      : 'Recently';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-card border border-border rounded-xl p-4 hover:border-accent/40 hover:shadow-md hover:shadow-accent/5 transition-all duration-200"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-border/30 border border-border/50 group-hover:border-accent/20 transition-colors">
            {cfg.icon}
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}>
            {item.type}
          </span>
          {item.isTopCoverage && (
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-text-secondary/70 shrink-0 mt-0.5">
          <Clock className="w-3 h-3" />
          {timeLabel}
        </div>
      </div>

      {/* Headline */}
      <p className="text-sm font-semibold text-text-primary leading-snug line-clamp-2 mb-3">
        {item.headline}
      </p>

      {/* Action */}
      {item.link ? (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent/10 hover:bg-accent/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          View Source
        </a>
      ) : (
        <span className="text-xs text-text-secondary/50 italic">No link available</span>
      )}
    </motion.div>
  );
}

/* ─── Table row (desktop) ──────────────────────────────── */
function CoverageRow({ item, index }: { item: CoverageItem; index: number }) {
  const cfg = getConfig(item.type);
  const timeLabel =
    item.createdAt && !isNaN(new Date(item.createdAt).getTime())
      ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
      : 'Recently';

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group hover:bg-accent/5 transition-colors"
    >
      {/* Type */}
      <td className="px-5 py-4 w-40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-border/30 border border-border/50 group-hover:border-accent/20 transition-colors shrink-0">
            {cfg.icon}
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}>
            {item.type}
          </span>
        </div>
      </td>

      {/* Headline */}
      <td className="px-5 py-4">
        <div className="flex items-start gap-2">
          {item.isTopCoverage && (
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium text-text-primary line-clamp-1 leading-snug">
            {item.headline}
          </p>
        </div>
      </td>

      {/* Time */}
      <td className="px-5 py-4 w-36">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary/70">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {timeLabel}
        </div>
      </td>

      {/* Action */}
      <td className="px-5 py-4 w-36 text-right">
        {item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent/10 hover:bg-accent/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View Source
          </a>
        ) : (
          <span className="text-xs text-text-secondary/50 italic">No link</span>
        )}
      </td>
    </motion.tr>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function NewsCoverage() {
  const { data: latestCoverage, isLoading } = useLatestCoverage();

  const isEmpty = !isLoading && (!latestCoverage || latestCoverage.length === 0);

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-accent/70 mb-0.5">
            Media Intelligence
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Latest News Coverage
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Real-time brand mentions across all media channels.
          </p>
        </div>

        {/* Count pill */}
        {!isLoading && latestCoverage && latestCoverage.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="self-start sm:self-auto flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full ring-1 ring-accent/20"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            {latestCoverage.length} articles
          </motion.div>
        )}
      </div>

      {/* ── Desktop table (md+) ── */}
      <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg/40">
                <th className="px-5 py-3.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Type</th>
                <th className="px-5 py-3.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Headline / Coverage</th>
                <th className="px-5 py-3.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Time</th>
                <th className="px-5 py-3.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <AnimatePresence>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                          <Skeleton className="w-14 h-5 rounded-md" />
                        </div>
                      </td>
                      <td className="px-5 py-4"><Skeleton className="h-4 w-full max-w-md" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-5 py-4 text-right"><Skeleton className="h-7 w-24 ml-auto rounded-lg" /></td>
                    </tr>
                  ))
                ) : isEmpty ? null : (
                  latestCoverage!.map((item: CoverageItem, i: number) => (
                    <CoverageRow key={item.id ?? item._id ?? i} item={item} index={i} />
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Empty state inside table container */}
        {isEmpty && (
          <div className="py-16 flex flex-col items-center gap-3 text-text-secondary">
            <Newspaper className="w-10 h-10 opacity-20" />
            <p className="text-sm">No recent news coverage found.</p>
          </div>
        )}
      </div>

      {/* ── Mobile card list (< md) ── */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-7 h-7 rounded-lg" />
                  <Skeleton className="w-14 h-5 rounded-md" />
                </div>
                <Skeleton className="w-20 h-4" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-7 w-24 rounded-lg" />
            </div>
          ))
        ) : isEmpty ? (
          <div className="py-14 flex flex-col items-center gap-3 text-text-secondary bg-card border border-border rounded-xl">
            <Newspaper className="w-9 h-9 opacity-20" />
            <p className="text-sm">No recent news coverage found.</p>
          </div>
        ) : (
          latestCoverage!.map((item: CoverageItem, i: number) => (
            <CoverageCard key={item.id ?? item._id ?? i} item={item} index={i} />
          ))
        )}
      </div>

    </div>
  );
}