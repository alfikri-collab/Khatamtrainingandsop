import { useMemo, useState } from 'react';
import { AlertTriangle, Bell, ExternalLink, Info } from 'lucide-react';
import type {
  Announcement,
  AnnouncementCategory,
  NavSection,
  UserProfile,
} from '../types/hub';
import { canManageContent, isSafeExternalUrl } from '../utils/formatters';

interface AnnouncementsViewProps {
  userProfile: UserProfile;
  announcements: Announcement[];
  highlightedId: string | null;
  onNavigate: (section: NavSection) => void;
}

const CATEGORIES: Array<'All' | AnnouncementCategory> = [
  'All',
  'Operational',
  'New SOP',
  'Revised Procedure',
  'Training',
  'System Maintenance',
  'Campaign',
];

export function AnnouncementsView({
  userProfile,
  announcements,
  highlightedId,
  onNavigate,
}: AnnouncementsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | AnnouncementCategory>('All');
  const isManager = canManageContent(userProfile.role);

  const visible = useMemo(() => {
    return announcements
      .filter((a) => a.status === 'published')
      .filter((a) => (selectedCategory === 'All' ? true : a.category === selectedCategory))
      .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
  }, [announcements, selectedCategory]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Announcements &amp; Updates
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Official Retail Management notices, SOP releases, system maintenance schedules, and campaign updates.
          </p>
        </div>

        {isManager && (
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Publish Announcement
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-zinc-900 text-white'
                : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
          <p className="text-sm font-medium text-zinc-900 mb-1">
            No announcements in this category
          </p>
          <p className="text-xs text-zinc-500">
            Check back later or select &ldquo;All&rdquo; to view all retail management updates.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((ann) => {
            const hasUrl = isSafeExternalUrl(ann.relatedUrl);
            const isHighlighted = highlightedId === ann.id;
            const isHigh = ann.priority === 'High';
            return (
              <article
                key={ann.id}
                className={`bg-white rounded-xl p-6 transition-colors ${
                  isHighlighted ? 'border-2 border-[#9A732E]' : 'border border-zinc-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 mb-2">
                  <div className="flex items-center gap-2">
                    {isHigh ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        High Priority
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-zinc-700">
                        {ann.priority === 'Normal' ? (
                          <Bell className="w-3.5 h-3.5 text-[#9A732E]" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                        {ann.priority} Priority
                      </span>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{ann.category}</span>
                  </div>

                  <span className="font-mono tabular-nums">Published {ann.publishedDate}</span>
                </div>

                <h2 className="text-lg font-semibold text-zinc-900 mb-2">{ann.title}</h2>
                <p className="text-sm text-zinc-700 leading-relaxed mb-4">{ann.description}</p>

                {hasUrl ? (
                  <a
                    href={ann.relatedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#78561D] hover:underline"
                  >
                    {ann.relatedLabel || 'Open Related Document'}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  ann.relatedLabel && (
                    <span className="text-xs text-zinc-500">
                      Reference: {ann.relatedLabel}
                    </span>
                  )
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
