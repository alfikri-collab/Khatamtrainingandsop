import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  FolderOpen,
  PlayCircle,
  Search,
  X,
} from 'lucide-react';
import type {
  NavSection,
  TrainingCategory,
  TrainingModule,
  UserProfile,
  UserProgress,
} from '../types/hub';
import { canManageContent, formatFirestoreDate, isSafeExternalUrl } from '../utils/formatters';
import { HubIcon } from './IconResolver';

interface TrainingCentreViewProps {
  userProfile: UserProfile;
  categories: TrainingCategory[];
  modules: TrainingModule[];
  progressItems: UserProgress[];
  selectedCategoryId: string | null;
  selectedModuleId: string | null;
  onSelectCategory: (id: string | null) => void;
  onSelectModule: (id: string | null) => void;
  onToggleComplete: (module: TrainingModule, currentlyCompleted: boolean) => Promise<void>;
  onJumpToSop: (sopCode: string) => void;
  onNavigate: (section: NavSection) => void;
}

export function TrainingCentreView({
  userProfile,
  categories,
  modules,
  progressItems,
  selectedCategoryId,
  selectedModuleId,
  onSelectCategory,
  onSelectModule,
  onToggleComplete,
  onJumpToSop,
  onNavigate,
}: TrainingCentreViewProps) {
  const [searchText, setSearchText] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const activeCategories = useMemo(
    () =>
      categories
        .filter((c) => c.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );

  const visibleModules = useMemo(
    () => modules.filter((m) => m.status === 'published'),
    [modules]
  );

  const completedSet = useMemo(
    () =>
      new Set(
        progressItems
          .filter((p) => p.itemType === 'training')
          .map((p) => p.itemId)
      ),
    [progressItems]
  );

  const filteredModules = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return visibleModules.filter((m) => {
      if (selectedCategoryId && m.categoryId !== selectedCategoryId) return false;
      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.relatedSopCode.toLowerCase().includes(q)
      );
    });
  }, [visibleModules, selectedCategoryId, searchText]);

  const activeCategory = activeCategories.find((c) => c.id === selectedCategoryId) || null;
  const activeModule = visibleModules.find((m) => m.id === selectedModuleId) || null;
  const isManager = canManageContent(userProfile.role);

  const handleToggle = async (mod: TrainingModule) => {
    setTogglingId(mod.id);
    try {
      await onToggleComplete(mod, completedSet.has(mod.id));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Retail Training Centre
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Structured training curriculum across {activeCategories.length} retail competency tracks ({completedSet.size}/{visibleModules.length} completed).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Filter training modules..."
              className="pl-9 pr-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 w-64"
            />
          </div>
          {isManager && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="px-3.5 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Manage Modules
            </button>
          )}
        </div>
      </div>

      {/* Category Cards Grid */}
      {!selectedCategoryId && !searchText.trim() && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeCategories.map((cat) => {
            const catModules = visibleModules.filter((m) => m.categoryId === cat.id);
            const catCompleted = catModules.filter((m) => completedSet.has(m.id)).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className="text-left bg-white border border-zinc-200 rounded-xl p-6 hover:border-zinc-400 transition-colors flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-900">
                      <HubIcon name={cat.iconName} className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono tabular-nums text-zinc-500">
                      Track {cat.code} · {catModules.length} modules
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
                    {catCompleted}/{catModules.length} completed
                  </span>
                  <span className="font-medium text-[#78561D]">Open Track</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Category Header / Back Navigation */}
      {(selectedCategoryId || searchText.trim()) && (
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {selectedCategoryId && (
                <button
                  type="button"
                  onClick={() => onSelectCategory(null)}
                  className="p-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                  aria-label="Back to all training categories"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <p className="text-xs font-mono text-zinc-500">
                  {activeCategory ? `Category ${activeCategory.code}` : 'Filtered Modules'}
                </p>
                <h2 className="text-lg font-semibold text-zinc-900">
                  {activeCategory ? activeCategory.title : 'All Matching Training Modules'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => onSelectCategory(null)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                  !selectedCategoryId
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                All Tracks
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

          {filteredModules.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
              <p className="text-sm font-medium text-zinc-900 mb-1">
                No training modules match your current selection
              </p>
              <p className="text-xs text-zinc-500 mb-4">
                Clear your search filter or switch to another training track.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredModules.map((mod) => {
                const isDone = completedSet.has(mod.id);
                const cat = activeCategories.find((c) => c.id === mod.categoryId);
                return (
                  <div
                    key={mod.id}
                    className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-400 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 mb-2">
                        <span>{cat ? `${cat.code}. ${cat.title}` : 'Training Module'}</span>
                        <span className="font-mono tabular-nums">
                          Updated {formatFirestoreDate(mod.updatedAt)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectModule(mod.id)}
                        className="text-left group cursor-pointer"
                      >
                        <h3 className="text-base font-semibold text-zinc-900 group-hover:text-[#78561D] transition-colors mb-1.5">
                          {mod.title}
                        </h3>
                      </button>
                      <p className="text-xs text-zinc-600 leading-relaxed mb-4 line-clamp-2">
                        {mod.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggle(mod)}
                        disabled={togglingId === mod.id}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                          isDone ? 'text-emerald-700' : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {isDone ? 'Completed' : 'Mark Complete'}
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectModule(mod.id)}
                        className="text-xs font-medium text-zinc-900 hover:text-[#78561D] cursor-pointer"
                      >
                        Open Module →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Module Detail Modal */}
      {activeModule && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={activeModule.title}
        >
          <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-zinc-500 font-mono">
                  Last Updated {formatFirestoreDate(activeModule.updatedAt)} · Related SOP: {activeModule.relatedSopCode || 'None'}
                </p>
                <h2 className="text-xl font-semibold text-zinc-900 mt-0.5">
                  {activeModule.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSelectModule(null)}
                className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
                aria-label="Close module details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                  Module Overview
                </h3>
                <p className="text-sm text-zinc-700 leading-relaxed">{activeModule.description}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                  Learning Objectives
                </h3>
                {activeModule.learningObjectives.length === 0 ? (
                  <p className="text-xs text-zinc-500">No learning objectives listed yet.</p>
                ) : (
                  <ol className="list-decimal list-inside space-y-1.5 text-sm text-zinc-700">
                    {activeModule.learningObjectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
                <h3 className="text-xs font-semibold text-zinc-700 mb-1">
                  Training Materials &amp; Notes
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  {activeModule.materialsSummary || 'No additional material notes provided.'}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                  Documents, Video &amp; Assessment Links
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'PDF Training Guide', url: activeModule.pdfUrl, icon: FileText },
                    { label: 'Video Reference', url: activeModule.videoUrl, icon: PlayCircle },
                    { label: 'Google Drive Folder', url: activeModule.driveUrl, icon: FolderOpen },
                    { label: 'Quiz / Assessment', url: activeModule.quizUrl, icon: ClipboardCheck },
                  ].map((res) => {
                    const Icon = res.icon;
                    const valid = isSafeExternalUrl(res.url);
                    return valid ? (
                      <a
                        key={res.label}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg border border-zinc-200 hover:border-zinc-400 flex items-center justify-between gap-2 text-sm font-medium text-zinc-900"
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-[#9A732E]" />
                          {res.label}
                        </span>
                        <ExternalLink className="w-4 h-4 text-zinc-500" />
                      </a>
                    ) : (
                      <div
                        key={res.label}
                        className="p-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/70 flex items-center justify-between gap-2 text-xs text-zinc-500"
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-zinc-400" />
                          {res.label}
                        </span>
                        <span>Pending Upload</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
                <div className="text-xs">
                  <span className="text-zinc-500 block">Related Operational SOP</span>
                  {activeModule.relatedSopCode ? (
                    <button
                      type="button"
                      onClick={() => {
                        onJumpToSop(activeModule.relatedSopCode);
                        onSelectModule(null);
                      }}
                      className="font-medium text-[#78561D] hover:underline mt-0.5 cursor-pointer"
                    >
                      Open {activeModule.relatedSopCode} →
                    </button>
                  ) : (
                    <span className="text-zinc-600">None linked</span>
                  )}
                </div>
                <div className="text-xs">
                  <span className="text-zinc-500 block">Related Form / Checklist</span>
                  <span className="font-medium text-zinc-900 mt-0.5 block">
                    {activeModule.relatedFormTitle || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleToggle(activeModule)}
                disabled={togglingId === activeModule.id}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  completedSet.has(activeModule.id)
                    ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {completedSet.has(activeModule.id) ? 'Completed (Click to Undo)' : 'Mark Training Completed'}
              </button>

              {isManager && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectModule(null);
                    onNavigate('admin');
                  }}
                  className="text-xs font-medium text-zinc-700 hover:text-zinc-900 cursor-pointer"
                >
                  Edit Links in Admin Management
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
