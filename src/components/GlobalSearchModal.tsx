import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Link2,
  Search,
  X,
} from 'lucide-react';
import type {
  FaqEntry,
  FormTemplate,
  NavSection,
  QuickLink,
  SopDocument,
  TrainingModule,
} from '../types/hub';
import {
  formatReadingTime,
  getSopReadingMinutes,
  getTrainingReadingMinutes,
  isSafeExternalUrl,
} from '../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  initialQuery: string;
  onClose: () => void;
  trainingModules: TrainingModule[];
  sopDocuments: SopDocument[];
  quickLinks: QuickLink[];
  formsTemplates: FormTemplate[];
  faqs: FaqEntry[];
  onNavigate: (section: NavSection, itemId?: string) => void;
}

type SearchFilter = 'all' | 'sop' | 'training' | 'quick-links' | 'forms' | 'faq';

const SUGGESTED_KEYWORDS = [
  'Stock Transfer',
  'Refund',
  'Closing Procedure',
  'RFID',
  'Attendance',
  'Customer Complaint',
  'VM Display',
  'Sales Report',
];

export function GlobalSearchModal({
  isOpen,
  initialQuery,
  onClose,
  trainingModules,
  sopDocuments,
  quickLinks,
  formsTemplates,
  faqs,
  onNavigate,
}: GlobalSearchModalProps) {
  const [queryText, setQueryText] = useState(initialQuery);
  const [filter, setFilter] = useState<SearchFilter>('all');

  useEffect(() => {
    setQueryText(initialQuery);
  }, [initialQuery, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    const match = (...fields: Array<string | undefined>) => {
      if (!q) return true;
      return fields.some((f) => f && f.toLowerCase().includes(q));
    };

    const matchedSops =
      filter === 'all' || filter === 'sop'
        ? sopDocuments
            .filter((s) =>
              match(
                s.sopCode,
                s.title,
                s.purpose,
                s.scope,
                s.personInCharge,
                s.procedures.join(' ')
              )
            )
            .slice(0, filter === 'all' ? 6 : 25)
        : [];

    const matchedTraining =
      filter === 'all' || filter === 'training'
        ? trainingModules
            .filter((m) =>
              match(m.title, m.description, m.materialsSummary, m.relatedSopCode)
            )
            .slice(0, filter === 'all' ? 6 : 25)
        : [];

    const matchedLinks =
      filter === 'all' || filter === 'quick-links'
        ? quickLinks
            .filter((l) =>
              match(l.title, l.description, l.category, l.accessInstructions)
            )
            .slice(0, filter === 'all' ? 6 : 25)
        : [];

    const matchedForms =
      filter === 'all' || filter === 'forms'
        ? formsTemplates
            .filter((f) => match(f.title, f.description, f.category, f.formatType))
            .slice(0, filter === 'all' ? 5 : 25)
        : [];

    const matchedFaqs =
      filter === 'all' || filter === 'faq'
        ? faqs
            .filter((f) => match(f.question, f.answer, f.category, f.sopRef))
            .slice(0, filter === 'all' ? 5 : 25)
        : [];

    return {
      sops: matchedSops,
      training: matchedTraining,
      links: matchedLinks,
      forms: matchedForms,
      faqs: matchedFaqs,
      total:
        matchedSops.length +
        matchedTraining.length +
        matchedLinks.length +
        matchedForms.length +
        matchedFaqs.length,
    };
  }, [queryText, filter, sopDocuments, trainingModules, quickLinks, formsTemplates, faqs]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-[1px] flex items-start justify-center p-4 sm:pt-16 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Global Hub Search"
    >
      <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-3xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search SOP, Training, Guidelines, Forms, FAQs or Quick Links..."
            className="flex-1 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none bg-transparent"
          />
          {queryText && (
            <button
              type="button"
              onClick={() => setQueryText('')}
              className="text-xs text-zinc-500 hover:text-zinc-900 px-2 py-1"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-zinc-200/70 rounded-lg overflow-x-auto max-w-full">
            {(
              [
                ['all', 'All Results'],
                ['sop', 'SOPs'],
                ['training', 'Training'],
                ['quick-links', 'Quick Links'],
                ['forms', 'Forms'],
                ['faq', 'FAQs'],
              ] as Array<[SearchFilter, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  filter === key
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <span className="text-xs text-zinc-500 font-mono tabular-nums">
            {results.total} matches
          </span>
        </div>

        {!queryText.trim() && (
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-xs font-medium text-zinc-500 mb-2">Suggested Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_KEYWORDS.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => setQueryText(kw)}
                  className="px-2.5 py-1 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors cursor-pointer"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-zinc-100">
          {results.total === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-zinc-900 mb-1">
                No matching documents or resources found
              </p>
              <p className="text-xs text-zinc-500">
                Try a partial keyword like &ldquo;Transfer&rdquo;, &ldquo;Closing&rdquo;, &ldquo;RFID&rdquo;, or switch the category filter.
              </p>
            </div>
          ) : (
            <>
              {results.sops.length > 0 && (
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-zinc-500 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Operational SOPs
                  </h3>
                  <div className="space-y-1.5">
                    {results.sops.map((sop) => (
                      <button
                        key={sop.id}
                        type="button"
                        onClick={() => {
                          onNavigate('sops', sop.id);
                          onClose();
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-200 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">
                            {sop.title}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            <span className="font-mono">{sop.sopCode}</span> · v{sop.version} · {formatReadingTime(getSopReadingMinutes(sop))} · {sop.approvalStatus}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-[#78561D] shrink-0">
                          Open SOP
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.training.length > 0 && (
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-zinc-500 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Training Modules
                  </h3>
                  <div className="space-y-1.5">
                    {results.training.map((mod) => (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => {
                          onNavigate('training', mod.id);
                          onClose();
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-200 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">
                            {mod.title}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {formatReadingTime(getTrainingReadingMinutes(mod))} · {mod.description}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-[#78561D] shrink-0">
                          View Module
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.links.length > 0 && (
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-zinc-500 mb-2 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" />
                    Quick Links
                  </h3>
                  <div className="space-y-1.5">
                    {results.links.map((link) => {
                      const hasUrl = isSafeExternalUrl(link.url);
                      return (
                        <div
                          key={link.id}
                          className="px-3 py-2.5 rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-200 flex items-center justify-between gap-3"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onNavigate('quick-links', link.id);
                              onClose();
                            }}
                            className="min-w-0 text-left flex-1 cursor-pointer"
                          >
                            <p className="text-sm font-medium text-zinc-900 truncate">
                              {link.title}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">
                              {link.category} · {link.description}
                            </p>
                          </button>
                          {hasUrl ? (
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-900 hover:text-[#78561D] shrink-0"
                            >
                              Open
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onNavigate('quick-links', link.id);
                                onClose();
                              }}
                              className="text-xs text-zinc-500 hover:text-zinc-900 shrink-0 cursor-pointer"
                            >
                              View
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {results.forms.length > 0 && (
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-zinc-500 mb-2 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Forms &amp; Templates
                  </h3>
                  <div className="space-y-1.5">
                    {results.forms.map((form) => (
                      <button
                        key={form.id}
                        type="button"
                        onClick={() => {
                          onNavigate('forms', form.id);
                          onClose();
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-200 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">
                            {form.title}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {form.category} · {form.formatType}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-[#78561D] shrink-0">
                          View Form
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.faqs.length > 0 && (
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-zinc-500 mb-2 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    FAQ Centre
                  </h3>
                  <div className="space-y-1.5">
                    {results.faqs.map((faq) => (
                      <button
                        key={faq.id}
                        type="button"
                        onClick={() => {
                          onNavigate('faq', faq.id);
                          onClose();
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-200 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">
                            {faq.question}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {faq.category} · Ref: {faq.sopRef || 'General'}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-[#78561D] shrink-0">
                          Read Answer
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
