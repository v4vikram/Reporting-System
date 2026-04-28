import React from 'react';
import { CoverageItem } from '../../reports/types/index.ts';
import { motion } from 'motion/react';
import { Newspaper, Globe, Tv, ExternalLink, Calendar, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLatestCoverage } from '../../../hooks/useReports.ts';

export default function NewsCoverage() {
  const { data: latestCoverage, isLoading } = useLatestCoverage();

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'Online':
        return 'bg-blue-100 text-blue-700 font-bold';
      case 'Print':
        return 'bg-green-100 text-green-700 font-bold';
      case 'TV':
        return 'bg-orange-100 text-orange-700 font-bold';
      default:
        return 'bg-gray-100 text-gray-700 font-bold';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Online':
        return <Globe className="w-5 h-5 text-blue-600" />;
      case 'Print':
        return <Newspaper className="w-5 h-5 text-green-600" />;
      case 'TV':
        return <Tv className="w-5 h-5 text-orange-600" />;
      default:
        return <Newspaper className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">LATEST NEWS COVERAGE</h1>
          <p className="text-text-secondary text-sm">Real-time update on your brand mentions across media.</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg/50 border-b border-border">
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Headline / Coverage</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-secondary">
                    <div className="flex flex-col items-center justify-center gap-2">
                       <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                       <span>Loading latest coverage...</span>
                    </div>
                  </td>
                </tr>
              ) : latestCoverage && latestCoverage.length > 0 ? (
                latestCoverage.map((item: CoverageItem, i: number) => (
                  <motion.tr 
                    key={item.id || item._id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-accent/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-border group-hover:border-accent/30 transition-colors">
                          {getIcon(item.type)}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-tighter ${getBadgeStyle(item.type)}`}>
                          {item.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {item.isTopCoverage && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                        )}
                        <p className="text-sm font-semibold text-text-primary line-clamp-2">{item.headline}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.createdAt && !isNaN(new Date(item.createdAt).getTime()) 
                          ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) 
                          : 'Recently'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.link ? (
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-blue-700 transition-colors bg-accent/10 px-3 py-1.5 rounded-lg"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View Source
                        </a>
                      ) : (
                        <span className="text-xs text-text-secondary italic">No link available</span>
                      )}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-secondary">
                    <div className="flex flex-col items-center gap-2">
                      <Newspaper className="w-8 h-8 opacity-20" />
                      <p>No recent news coverage found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
