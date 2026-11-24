import { useMemo, useState } from 'react';
import { ExternalLink, Info, Search, Settings } from 'lucide-react';
import type { NavSection, QuickLink, QuickLinkCategory, UserProfile } from '../types/hub';
import { canManageContent, isSafeExternalUrl } from '../utils/formatters';
import { HubIcon } from './IconResolver';

interface QuickLinksViewProps {
  userProfile: UserProfile;
  quickLinks: QuickLink[];
  highlightedId: string | null;
  onNavigate: (section: NavSection) => void;
}

const CATEGORIES: Array<'All' | QuickLinkCategory> = [
  'All',
  'Sales & Reporting',
  'Inventory & Stock',
  'HR & Staff Management',
  'Visual Merchandising',
  'Operations & Administration',
  'Learning & Development',
];

export function QuickLinksView({
  userProfile,
  quickLinks,
  highlightedId,
  onNavigate,
}: QuickLinksViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | QuickLinkCategory>('All');
  const [searchText, setSearchText] = useState('');

  const isManager = canManageContent(userProfile.role);

  const visibleLinks = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return quickLinks
      .filter((l) => l.status === 'published')
      .filter((l) => (selectedCategory === 'All' ? true : l.category === selectedCategory))
      .filter((l) => {
        if (!q) return true;
        return (
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q) ||
          l.accessInstructions.toLowerCase().includes(q)
        );
      });
  }, [quickLinks, selectedCategory, searchText]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Quick Links &amp; Retail Systems
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Direct one-click access to POS, Xilnex, RFID, Marksold, dashboards, sheets, and HR forms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Filter quick links..."
              className="pl-9 pr-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 w-64"
            />
          </div>
          {isManager && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              Configure URLs
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-zinc-900 text-white'
                : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {visibleLinks.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
          <p className="text-sm font-medium text-zinc-900 mb-1">
            No quick links match your filter
          </p>
          <p className="text-xs text-zinc-500 mb-4">
            Try clearing the search box or selecting &ldquo;All&rdquo; categories.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchText('');
              setSelectedCategory('All');
            }}
            className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 cursor-pointer"
          >
            Show All Quick Links
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleLinks.map((link) => {
            const hasUrl = isSafeExternalUrl(link.url);
            const isHighlighted = highlightedId === link.id;
            return (
              <div
                key={link.id}
                className={`bg-white rounded-xl p-5 flex flex-col justify-between transition-colors ${
                  isHighlighted
                    ? 'border-2 border-[#9A732E]'
                    : 'border border-zinc-200 hover:border-zinc-400'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-900 shrink-0">
                      <HubIcon name={link.iconName} className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-zinc-500 text-right">
                      {link.category}
                    </span>
                  </div>

                  <h2 className="text-base font-semibold text-zinc-900 mb-1">
                    {link.title}
                  </h2>
                  <p className="text-xs text-zinc-600 leading-relaxed mb-3">
                    {link.description}
                  </p>

                  {link.accessInstructions && (
                    <div className="flex items-start gap-2 text-xs text-zinc-500 bg-zinc-50 rounded-lg p-2.5 mb-4 border border-zinc-100">
                      <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                      <span>{link.accessInstructions}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                  {hasUrl ? (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      Open Link
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <div className="w-full flex items-center justify-between gap-2">
                      <span className="text-xs text-amber-700 font-medium">
                        URL Pending Setup
                      </span>
                      {isManager ? (
                        <button
                          type="button"
                          onClick={() => onNavigate('admin')}
                          className="text-xs font-medium text-zinc-900 hover:text-[#78561D] underline cursor-pointer"
                        >
                          Set URL
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-400">Contact Admin</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
