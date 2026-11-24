import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  Printer,
  Search,
  X,
} from 'lucide-react';
import type {
  NavSection,
  SopCategory,
  SopDocument,
  UserProfile,
  UserProgress,
} from '../types/hub';
import { canManageContent, formatFirestoreDate, isSafeExternalUrl } from '../utils/formatters';
import { HubIcon } from './IconResolver';

interface SopLibraryViewProps {
  userProfile: UserProfile;
  categories: SopCategory[];
  sops: SopDocument[];
  progressItems: UserProgress[];
  selectedCategoryId: string | null;
  selectedSopId: string | null;
  onSelectCategory: (id: string | null) => void;
  onSelectSop: (id: string | null) => void;
  onToggleAcknowledge: (sop: SopDocument, currentlyAcknowledged: boolean) => Promise<void>;
  onNavigate: (section: NavSection) => void;
}

export function SopLibraryView({
  userProfile,
  categories,
  sops,
  progressItems,
  selectedCategoryId,
  selectedSopId,
  onSelectCategory,
  onSelectSop,
  onToggleAcknowledge,
  onNavigate,
}: SopLibraryViewProps) {
  const [searchText, setSearchText] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const activeCategories = useMemo(
    () =>
      categories
        .filter((c) => c.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );

  const publishedSops = useMemo(
    () =>
      sops
        .filter((s) => s.status === 'published')
        .sort((a, b) => a.sopCode.localeCompare(b.sopCode)),
    [sops]
  );

  const acknowledgedSet = useMemo(
    () =>
      new Set(
        progressItems
          .filter((p) => p.itemType === 'sop')
          .map((p) => p.itemId)
      ),
    [progressItems]
  );

  const filteredSops = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return publishedSops.filter((s) => {
      if (selectedCategoryId && s.categoryId !== selectedCategoryId) return false;
      if (!q) return true;
      return (
        s.sopCode.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.purpose.toLowerCase().includes(q) ||
        s.personInCharge.toLowerCase().includes(q)
      );
    });
  }, [publishedSops, selectedCategoryId, searchText]);

  const activeCategory = activeCategories.find((c) => c.id === selectedCategoryId) || null;
  const activeSop = publishedSops.find((s) => s.id === selectedSopId) || null;
  const isManager = canManageContent(userProfile.role);

  const handleToggle = async (sop: SopDocument) => {
    setTogglingId(sop.id);
    try {
      await onToggleAcknowledge(sop, acknowledgedSet.has(sop.id));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Retail Operational SOP Library
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Standard Operating Procedures across {activeCategories.length} retail functions ({acknowledgedSet.size}/{publishedSops.length} acknowledged).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search SOP code or title..."
              className="pl-9 pr-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 w-64"
            />
          </div>
          {isManager && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="px-3.5 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Manage SOPs
            </button>
          )}
        </div>
      </div>

      {/* Category Cards Grid */}
      {!selectedCategoryId && !searchText.trim() && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeCategories.map((cat) => {
            const catSops = publishedSops.filter((s) => s.categoryId === cat.id);
            const approvedCount = catSops.filter(
              (s) => s.approvalStatus === 'Management Approved'
            ).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className="text-left bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-400 transition-colors flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-900">
                      <HubIcon name={cat.iconName} className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono tabular-nums text-zinc-500">
                      {cat.code} · {catSops.length} SOPs
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-zinc-900 mb-1.5">
                    {cat.code}. {cat.title}
                  </h2>
                  <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-mono tabular-nums">
                    {approvedCount} approved
                  </span>
                  <span className="font-medium text-[#78561D]">Open SOPs</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* SOP List Table */}
      {(selectedCategoryId || searchText.trim()) && (
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {selectedCategoryId && (
                <button
                  type="button"
                  onClick={() => onSelectCategory(null)}
                  className="p-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                  aria-label="Back to all SOP categories"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <p className="text-xs font-mono text-zinc-500">
                  {activeCategory ? `Function ${activeCategory.code}` : 'Filtered SOPs'}
                </p>
                <h2 className="text-lg font-semibold text-zinc-900">
                  {activeCategory ? activeCategory.title : 'All Matching SOP Documents'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => onSelectCategory(null)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                  !selectedCategoryId
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                All Functions
              </button>
              {activeCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectCategory(c.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedCategoryId === c.id
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {c.code}. {c.title}
                </button>
              ))}
            </div>
          </div>

          {filteredSops.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
              <p className="text-sm font-medium text-zinc-900 mb-1">
                No SOP documents found for this filter
              </p>
              <p className="text-xs text-zinc-500 mb-4">
                Adjust your search keyword or view all operational functions.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchText('');
                  onSelectCategory(null);
                }}
                className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/70 text-xs text-zinc-500">
                      <th className="py-3 px-4 font-medium">SOP Ref</th>
                      <th className="py-3 px-4 font-medium">SOP Title</th>
                      <th className="py-3 px-4 font-medium">Person in Charge</th>
                      <th className="py-3 px-4 font-medium">Document Status</th>
                      <th className="py-3 px-4 font-medium">Version</th>
                      <th className="py-3 px-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-sm">
                    {filteredSops.map((sop) => {
                      const isAck = acknowledgedSet.has(sop.id);
                      return (
                        <tr key={sop.id} className="hover:bg-zinc-50/70">
                          <td className="py-3 px-4 font-mono text-xs text-zinc-600 whitespace-nowrap">
                            {sop.sopCode}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => onSelectSop(sop.id)}
                              className="font-medium text-zinc-900 hover:text-[#78561D] text-left cursor-pointer"
                            >
                              {sop.title}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-xs text-zinc-600">
                            {sop.personInCharge}
                          </td>
                          <td className="py-3 px-4 text-xs whitespace-nowrap">
                            <span
                              className={
                                sop.approvalStatus === 'Management Approved'
                                  ? 'text-emerald-700 font-medium'
                                  : 'text-amber-700'
                              }
                            >
                              {sop.approvalStatus}
                            </span>
                            {isAck && (
                              <span className="text-zinc-400"> · Acknowledged</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-zinc-600 tabular-nums whitespace-nowrap">
                            v{sop.version}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => onSelectSop(sop.id)}
                              className="text-xs font-medium text-zinc-900 hover:text-[#78561D] cursor-pointer"
                            >
                              Read SOP →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SOP Detail Modal */}
      {activeSop && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={activeSop.title}
        >
          <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-mono text-zinc-500 tabular-nums">
                  {activeSop.sopCode} · Version {activeSop.version} · Updated {formatFirestoreDate(activeSop.updatedAt)}
                </p>
                <h2 className="text-xl font-semibold text-zinc-900 mt-0.5">
                  {activeSop.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSelectSop(null)}
                className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
                aria-label="Close SOP document"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {activeSop.approvalStatus === 'Placeholder Template' && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900">
                    <p className="font-semibold mb-0.5">
                      Editable Placeholder Template — Pending Management Approval
                    </p>
                    <p>
                      This outline uses editable placeholder text until Retail Management uploads the official approved Khatam Retail SOP document.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-zinc-50 border border-zinc-200 text-xs">
                <div>
                  <span className="text-zinc-500 block mb-0.5">Department / Category</span>
                  <span className="font-medium text-zinc-900">
                    {activeCategories.find((c) => c.id === activeSop.categoryId)?.title || 'Retail Operations'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-0.5">Person in Charge</span>
                  <span className="font-medium text-zinc-900">{activeSop.personInCharge}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-0.5">Related Training</span>
                  <span className="font-medium text-zinc-900">{activeSop.relatedTrainingTitle || '—'}</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                  Purpose
                </h3>
                <p className="text-sm text-zinc-700 leading-relaxed">{activeSop.purpose}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                  Scope
                </h3>
                <p className="text-sm text-zinc-700 leading-relaxed">{activeSop.scope}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                  Step-by-Step Procedures
                </h3>
                {activeSop.procedures.length === 0 ? (
                  <p className="text-xs text-zinc-500">No procedure steps added yet.</p>
                ) : (
                  <ol className="space-y-2">
                    {activeSop.procedures.map((step, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200/80 text-sm text-zinc-800"
                      >
                        <span className="font-mono text-xs font-semibold text-zinc-500 pt-0.5 shrink-0">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {activeSop.reminders.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                    Important Reminders
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-zinc-700">
                    {activeSop.reminders.map((rem, idx) => (
                      <li key={idx}>{rem}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-100 text-xs text-zinc-600">
                <span className="font-medium text-zinc-900">Related Documents: </span>
                {activeSop.relatedDocuments || 'None linked'}
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggle(activeSop)}
                  disabled={togglingId === activeSop.id}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    acknowledgedSet.has(activeSop.id)
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {acknowledgedSet.has(activeSop.id) ? 'SOP Acknowledged' : 'Acknowledge SOP'}
                </button>

                {isSafeExternalUrl(activeSop.pdfUrl) ? (
                  <a
                    href={activeSop.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100"
                  >
                    <Download className="w-4 h-4" />
                    Download Approved PDF
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Print / Save PDF
                  </button>
                )}
              </div>

              {isManager && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectSop(null);
                    onNavigate('admin');
                  }}
                  className="text-xs font-medium text-zinc-700 hover:text-zinc-900 cursor-pointer"
                >
                  Edit / Upload PDF in Admin
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
