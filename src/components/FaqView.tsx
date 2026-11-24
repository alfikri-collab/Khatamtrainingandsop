import { useMemo, useState } from 'react';
import { ChevronDown, ExternalLink, FileText, Search } from 'lucide-react';
import type { FaqEntry, NavSection, UserProfile } from '../types/hub';
import { canManageContent, isSafeExternalUrl } from '../utils/formatters';

interface FaqViewProps {
  userProfile: UserProfile;
  faqs: FaqEntry[];
  highlightedId: string | null;
  onJumpToSop: (sopCode: string) => void;
  onNavigate: (section: NavSection) => void;
}

export function FaqView({
  userProfile,
  faqs,
  highlightedId,
  onJumpToSop,
  onNavigate,
}: FaqViewProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(highlightedId);

  const isManager = canManageContent(userProfile.role);

  const publishedFaqs = useMemo(
    () => faqs.filter((f) => f.status === 'published'),
    [faqs]
  );

  const categories = useMemo(() => {
    const unique = Array.from(new Set(publishedFaqs.map((f) => f.category)));
    return ['All', ...unique];
  }, [publishedFaqs]);

  const filteredFaqs = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return publishedFaqs.filter((f) => {
      if (selectedCategory !== 'All' && f.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.sopRef.toLowerCase().includes(q)
      );
    });
  }, [publishedFaqs, selectedCategory, searchText]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Fast operational answers with direct SOP references and quick links to reduce repetitive enquiries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search questions..."
              className="pl-9 pr-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 w-64"
            />
          </div>
          {isManager && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="px-3.5 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Manage FAQs
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
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

      {filteredFaqs.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
          <p className="text-sm font-medium text-zinc-900 mb-1">
            No matching FAQ entries found
          </p>
          <p className="text-xs text-zinc-500 mb-4">
            Try a different keyword or select &ldquo;All&rdquo; categories.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchText('');
              setSelectedCategory('All');
            }}
            className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
          {filteredFaqs.map((faq) => {
            const isOpen = expandedId === faq.id || highlightedId === faq.id;
            const hasUrl = isSafeExternalUrl(faq.quickLinkUrl);
            return (
              <div key={faq.id} className="p-5">
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : faq.id)}
                  className="w-full text-left flex items-start justify-between gap-4 cursor-pointer"
                >
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">
                      {faq.category} {faq.sopRef ? `· ${faq.sopRef}` : ''}
                    </p>
                    <h2 className="text-base font-semibold text-zinc-900">
                      {faq.question}
                    </h2>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-zinc-100 space-y-4">
                    <p className="text-sm text-zinc-700 leading-relaxed">{faq.answer}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      {faq.sopRef && (
                        <button
                          type="button"
                          onClick={() => onJumpToSop(faq.sopRef)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Open {faq.sopRef}
                        </button>
                      )}
                      {hasUrl ? (
                        <a
                          href={faq.quickLinkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg"
                        >
                          {faq.quickLinkLabel || 'Open Quick Link'}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        faq.quickLinkLabel && (
                          <button
                            type="button"
                            onClick={() => onNavigate('quick-links')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#78561D] hover:underline cursor-pointer"
                          >
                            Find &ldquo;{faq.quickLinkLabel}&rdquo; in Quick Links →
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
