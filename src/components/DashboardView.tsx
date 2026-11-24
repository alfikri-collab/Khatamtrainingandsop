import { ArrowRight, Bell, BookOpen, CheckCircle2, FileText, Link2, Sparkles } from 'lucide-react';
import type {
  Announcement,
  NavSection,
  QuickLink,
  SopCategory,
  SopDocument,
  TrainingCategory,
  TrainingModule,
  UserProfile,
  UserProgress,
  VersionHistoryEntry,
} from '../types/hub';
import { formatFirestoreDate, getRoleLabel } from '../utils/formatters';
import { HubIcon } from './IconResolver';

interface DashboardViewProps {
  userProfile: UserProfile;
  trainingCategories: TrainingCategory[];
  trainingModules: TrainingModule[];
  sopCategories: SopCategory[];
  sopDocuments: SopDocument[];
  quickLinks: QuickLink[];
  announcements: Announcement[];
  versionHistory: VersionHistoryEntry[];
  progressItems: UserProgress[];
  onNavigate: (section: NavSection, itemId?: string) => void;
  onSelectTrainingCategory: (categoryId: string) => void;
  onSelectSopCategory: (categoryId: string) => void;
  onOpenSearch: () => void;
}

export function DashboardView({
  userProfile,
  trainingCategories,
  trainingModules,
  sopCategories,
  sopDocuments,
  quickLinks,
  announcements,
  versionHistory,
  progressItems,
  onNavigate,
  onSelectTrainingCategory,
  onSelectSopCategory,
  onOpenSearch,
}: DashboardViewProps) {
  const publishedModules = trainingModules.filter((m) => m.status === 'published');
  const publishedSops = sopDocuments.filter((s) => s.status === 'published');
  const publishedLinks = quickLinks.filter((l) => l.status === 'published');
  const publishedAnnouncements = announcements.filter((a) => a.status === 'published');
  const highPriorityAnnouncements = publishedAnnouncements.filter((a) => a.priority === 'High');

  const completedTrainings = progressItems.filter((p) => p.itemType === 'training').length;
  const acknowledgedSops = progressItems.filter((p) => p.itemType === 'sop').length;

  const summaryCards: Array<{
    label: string;
    value: number;
    caption: string;
    target: NavSection;
  }> = [
    {
      label: 'Total Training Modules',
      value: publishedModules.length,
      caption: `${trainingCategories.length} structured categories`,
      target: 'training',
    },
    {
      label: 'Total Operational SOPs',
      value: publishedSops.length,
      caption: `${sopCategories.length} operational functions`,
      target: 'sops',
    },
    {
      label: 'Quick Reference Links',
      value: publishedLinks.length,
      caption: 'POS, Xilnex, RFID, Sheets & HR',
      target: 'quick-links',
    },
    {
      label: 'Latest Updates',
      value: versionHistory.length,
      caption: 'Tracked document revisions',
      target: 'announcements',
    },
    {
      label: 'Important Announcements',
      value: highPriorityAnnouncements.length || publishedAnnouncements.length,
      caption: `${publishedAnnouncements.length} total active notices`,
      target: 'announcements',
    },
  ];

  const featuredQuickLinks = publishedLinks.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Hero / Welcome Banner */}
      <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-[#78561D] mb-2">
              {getRoleLabel(userProfile.role)} · {userProfile.outletName || 'Khatam Retail'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 text-balance mb-3">
              Welcome to Khatam Retail Learning Centre
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-2xl mb-6">
              One Platform. One Standard. Better Retail Operations. Locate training modules, standard operating procedures, operational forms, and daily retail tools in seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('quick-links')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Link2 className="w-4 h-4" />
              Open Quick Links
            </button>
            <button
              type="button"
              onClick={() => onNavigate('sops')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Browse SOP Library
            </button>
            <button
              type="button"
              onClick={onOpenSearch}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Quick Search
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative min-h-[200px] bg-zinc-100 border-t lg:border-t-0 lg:border-l border-zinc-200">
          <img
            src="/assets/aistudio/images_7ee0b728.jpg"
            alt="Khatam Retail store counter and interior"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover lg:absolute lg:inset-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-5 text-white flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-mono text-zinc-200">My Learning Progress</p>
              <p className="text-sm font-medium tabular-nums">
                {completedTrainings}/{publishedModules.length} Modules · {acknowledgedSops}/{publishedSops.length} SOPs
              </p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-zinc-200 shrink-0" />
          </div>
        </div>
      </section>

      {/* 5 Summary Metric Cards */}
      <section aria-label="Hub Summary Metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {summaryCards.map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={() => onNavigate(card.target)}
              className="text-left bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-400 transition-colors cursor-pointer flex flex-col justify-between"
            >
              <span className="text-xs font-medium text-zinc-500 mb-3">
                {card.label}
              </span>
              <div>
                <p className="text-2xl font-semibold text-zinc-900 font-mono tabular-nums">
                  {card.value}
                </p>
                <p className="text-xs text-zinc-500 mt-1">{card.caption}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Main Split: Announcements & Quick Links */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#9A732E]" />
              Important Announcements
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('announcements')}
              className="text-xs font-medium text-[#78561D] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              View All
            </button>
          </div>

          {publishedAnnouncements.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm font-medium text-zinc-900 mb-1">No active announcements</p>
              <p className="text-xs text-zinc-500">
                Retail Management updates and new SOP releases will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {publishedAnnouncements.slice(0, 4).map((ann) => (
                <button
                  key={ann.id}
                  type="button"
                  onClick={() => onNavigate('announcements', ann.id)}
                  className="w-full text-left py-3.5 first:pt-0 last:pb-0 hover:bg-zinc-50/80 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 mb-1">
                    <span className={ann.priority === 'High' ? 'font-semibold text-red-700' : 'text-zinc-600'}>
                      {ann.priority} Priority · {ann.category}
                    </span>
                    <span className="font-mono tabular-nums">{ann.publishedDate}</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-900 mb-1">{ann.title}</p>
                  <p className="text-xs text-zinc-600 line-clamp-2">{ann.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-[#9A732E]" />
              Frequently Used Systems &amp; Quick Links
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('quick-links')}
              className="text-xs font-medium text-[#78561D] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              All Quick Links ({publishedLinks.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {featuredQuickLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => onNavigate('quick-links', link.id)}
                className="text-left p-4 rounded-lg border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50/70 transition-colors flex items-start gap-3 cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800 shrink-0">
                  <HubIcon name={link.iconName} className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{link.title}</p>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">{link.category}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Training Categories & SOP Categories Quick Access */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#9A732E]" />
              Retail Training Centre
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('training')}
              className="text-xs font-medium text-[#78561D] hover:underline cursor-pointer"
            >
              Browse All
            </button>
          </div>
          <div className="divide-y divide-zinc-100">
            {trainingCategories
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((cat) => {
                const count = publishedModules.filter((m) => m.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelectTrainingCategory(cat.id);
                      onNavigate('training');
                    }}
                    className="w-full text-left py-3 flex items-center justify-between gap-3 hover:bg-zinc-50 px-2 -mx-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-semibold text-zinc-500 w-5 shrink-0">
                        {cat.code}.
                      </span>
                      <span className="text-sm font-medium text-zinc-900 truncate">
                        {cat.title}
                      </span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-zinc-500 shrink-0">
                      {count} modules
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#9A732E]" />
              Retail Operational SOPs
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('sops')}
              className="text-xs font-medium text-[#78561D] hover:underline cursor-pointer"
            >
              Browse All
            </button>
          </div>
          <div className="divide-y divide-zinc-100">
            {sopCategories
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((cat) => {
                const count = publishedSops.filter((s) => s.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelectSopCategory(cat.id);
                      onNavigate('sops');
                    }}
                    className="w-full text-left py-3 flex items-center justify-between gap-3 hover:bg-zinc-50 px-2 -mx-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-semibold text-zinc-500 w-5 shrink-0">
                        {cat.code}.
                      </span>
                      <span className="text-sm font-medium text-zinc-900 truncate">
                        {cat.title}
                      </span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-zinc-500 shrink-0">
                      {count} SOPs
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      </section>

      {/* Recent Revisions Audit Feed */}
      {versionHistory.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#9A732E]" />
              Recent Knowledge Updates
            </h2>
            <span className="text-xs text-zinc-500">Tracked Revision Log</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-xs text-zinc-500">
                  <th className="py-2.5 pr-4 font-medium">Document</th>
                  <th className="py-2.5 pr-4 font-medium">Version</th>
                  <th className="py-2.5 pr-4 font-medium">Summary</th>
                  <th className="py-2.5 pr-4 font-medium">Updated By</th>
                  <th className="py-2.5 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {versionHistory.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/70">
                    <td className="py-2.5 pr-4 font-medium text-zinc-900">{item.entityTitle}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-zinc-600 tabular-nums">
                      {item.version}
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-zinc-600">{item.changeSummary}</td>
                    <td className="py-2.5 pr-4 text-xs text-zinc-600">{item.changedByName}</td>
                    <td className="py-2.5 text-xs text-zinc-500 font-mono tabular-nums text-right">
                      {formatFirestoreDate(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
