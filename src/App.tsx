import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Link2,
  Megaphone,
  Menu,
  Search,
  Settings,
  X,
} from 'lucide-react';
import { testConnection } from './lib/firebase';
import { subscribeCollection } from './services/hubFirestore';
import {
  SEED_ROLES,
  buildSeedAnnouncements,
  buildSeedFaqs,
  buildSeedForms,
  buildSeedQuickLinks,
  buildSeedSopCategories,
  buildSeedSopDocuments,
  buildSeedTrainingCategories,
  buildSeedTrainingModules,
} from './data/seedCatalog';
import type {
  Announcement,
  FaqEntry,
  FormTemplate,
  NavSection,
  QuickLink,
  RoleDefinition,
  SopCategory,
  SopDocument,
  TrainingCategory,
  TrainingModule,
  UserProfile,
  UserProgress,
  VersionHistoryEntry,
} from './types/hub';
import { canManageContent, getRoleLabel } from './utils/formatters';
import { DashboardView } from './components/DashboardView';
import { TrainingCentreView } from './components/TrainingCentreView';
import { SopLibraryView } from './components/SopLibraryView';
import { QuickLinksView } from './components/QuickLinksView';
import { FormsLibraryView } from './components/FormsLibraryView';
import { FaqView } from './components/FaqView';
import { AnnouncementsView } from './components/AnnouncementsView';
import { AdminManagementView } from './components/AdminManagementView';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { BreadcrumbBar, type BreadcrumbItem } from './components/BreadcrumbBar';

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
  requiresManagement?: boolean;
}> = [
  { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'training', label: 'Retail Training Centre', icon: BookOpen },
  { id: 'sops', label: 'Retail Operational SOP', icon: FileText },
  { id: 'quick-links', label: 'Quick Links & Resources', icon: Link2 },
  { id: 'forms', label: 'Retail Forms & Templates', icon: FileSpreadsheet },
  { id: 'faq', label: 'FAQ Centre', icon: HelpCircle },
  { id: 'announcements', label: 'Announcements & Updates', icon: Megaphone },
  { id: 'admin', label: 'Admin Management', icon: Settings, requiresManagement: true },
];

const WORKSPACE_PROFILE_STORAGE_KEY = 'khatam_hub_workspace_profile_v1';
const WORKSPACE_PROGRESS_STORAGE_KEY = 'khatam_hub_progress_v1';

const DEFAULT_WORKSPACE_PROFILE: UserProfile = {
  uid: 'khatam_retail_workspace',
  displayName: 'Khatam Retail Team',
  role: 'RETAIL_STAFF',
  outletName: 'Khatam Retail',
  department: 'Retail Operations',
  status: 'active',
};

function loadWorkspaceProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(WORKSPACE_PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_WORKSPACE_PROFILE;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      ...DEFAULT_WORKSPACE_PROFILE,
      displayName: parsed.displayName?.trim() || DEFAULT_WORKSPACE_PROFILE.displayName,
      outletName: parsed.outletName?.trim() || DEFAULT_WORKSPACE_PROFILE.outletName,
      department: parsed.department?.trim() || DEFAULT_WORKSPACE_PROFILE.department,
    };
  } catch {
    return DEFAULT_WORKSPACE_PROFILE;
  }
}

function loadLocalProgress(): UserProgress[] {
  try {
    const raw = localStorage.getItem(WORKSPACE_PROGRESS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UserProgress[]) : [];
  } catch {
    return [];
  }
}

const FALLBACK_TRAINING_CATEGORIES = buildSeedTrainingCategories();
const FALLBACK_TRAINING_MODULES = buildSeedTrainingModules('seed_catalog');
const FALLBACK_SOP_CATEGORIES = buildSeedSopCategories();
const FALLBACK_SOP_DOCUMENTS = buildSeedSopDocuments('seed_catalog');
const FALLBACK_QUICK_LINKS = buildSeedQuickLinks('seed_catalog');
const FALLBACK_FORMS = buildSeedForms('seed_catalog');
const FALLBACK_FAQS = buildSeedFaqs('seed_catalog');
const FALLBACK_ANNOUNCEMENTS = buildSeedAnnouncements('seed_catalog');
const FALLBACK_ROLES: RoleDefinition[] = SEED_ROLES.map((r) => ({ id: r.code, ...r }));

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadWorkspaceProfile());

  // Navigation & Deep-Link State
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedTrainingCategoryId, setSelectedTrainingCategoryId] = useState<string | null>(null);
  const [selectedTrainingModuleId, setSelectedTrainingModuleId] = useState<string | null>(null);
  const [selectedSopCategoryId, setSelectedSopCategoryId] = useState<string | null>(null);
  const [selectedSopId, setSelectedSopId] = useState<string | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  // Header Overlays
  const [searchOpen, setSearchOpen] = useState(false);
  const [headerSearchInput, setHeaderSearchInput] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    displayName: userProfile.displayName,
    outletName: userProfile.outletName,
    department: userProfile.department,
  });

  // Firestore Live Data (with default catalog fallback until/unless populated in Firestore)
  const [trainingCategories, setTrainingCategories] = useState<TrainingCategory[]>(
    FALLBACK_TRAINING_CATEGORIES
  );
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>(
    FALLBACK_TRAINING_MODULES
  );
  const [sopCategories, setSopCategories] = useState<SopCategory[]>(FALLBACK_SOP_CATEGORIES);
  const [sopDocuments, setSopDocuments] = useState<SopDocument[]>(FALLBACK_SOP_DOCUMENTS);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>(FALLBACK_QUICK_LINKS);
  const [formsTemplates, setFormsTemplates] = useState<FormTemplate[]>(FALLBACK_FORMS);
  const [faqs, setFaqs] = useState<FaqEntry[]>(FALLBACK_FAQS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(FALLBACK_ANNOUNCEMENTS);
  const [versionHistory, setVersionHistory] = useState<VersionHistoryEntry[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>(FALLBACK_ROLES);
  const [progressItems, setProgressItems] = useState<UserProgress[]>(() => loadLocalProgress());

  // Startup connection check & Firestore public catalog subscriptions
  useEffect(() => {
    void testConnection();

    const unsubs = [
      subscribeCollection<TrainingCategory>(
        'trainingCategories',
        { onlyActiveCategory: true },
        (items) => {
          if (items.length > 0) setTrainingCategories(items);
        }
      ),
      subscribeCollection<TrainingModule>(
        'trainingModules',
        { onlyPublished: true },
        (items) => {
          if (items.length > 0) setTrainingModules(items);
        }
      ),
      subscribeCollection<SopCategory>(
        'sopCategories',
        { onlyActiveCategory: true },
        (items) => {
          if (items.length > 0) setSopCategories(items);
        }
      ),
      subscribeCollection<SopDocument>(
        'sopDocuments',
        { onlyPublished: true },
        (items) => {
          if (items.length > 0) setSopDocuments(items);
        }
      ),
      subscribeCollection<QuickLink>(
        'quickLinks',
        { onlyPublished: true },
        (items) => {
          if (items.length > 0) setQuickLinks(items);
        }
      ),
      subscribeCollection<FormTemplate>(
        'formsTemplates',
        { onlyPublished: true },
        (items) => {
          if (items.length > 0) setFormsTemplates(items);
        }
      ),
      subscribeCollection<FaqEntry>('faqs', { onlyPublished: true }, (items) => {
        if (items.length > 0) setFaqs(items);
      }),
      subscribeCollection<Announcement>(
        'announcements',
        { onlyPublished: true },
        (items) => {
          if (items.length > 0) setAnnouncements(items);
        }
      ),
      subscribeCollection<VersionHistoryEntry>('versionHistory', {}, (items) => {
        setVersionHistory(
          items.slice().sort((a, b) => {
            const ta = (a.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
            const tb = (b.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
            return tb - ta;
          })
        );
      }),
      subscribeCollection<RoleDefinition>('roles', {}, (items) => {
        if (items.length > 0) setRoles(items);
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleToggleLocalProgress = async (
    itemType: 'training' | 'sop',
    itemId: string,
    itemTitle: string,
    currentlyCompleted: boolean
  ) => {
    const progressId = `${itemType}_${itemId}`;
    setProgressItems((prev) => {
      const next = currentlyCompleted
        ? prev.filter((p) => p.id !== progressId)
        : [
            ...prev.filter((p) => p.id !== progressId),
            {
              id: progressId,
              uid: userProfile.uid,
              itemType,
              itemId,
              itemTitle,
              completedAt: new Date().toISOString(),
            },
          ];
      try {
        localStorage.setItem(WORKSPACE_PROGRESS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  };

  const handleNavigate = (section: NavSection, itemId?: string) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    setHighlightedItemId(itemId || null);

    if (section === 'training' && itemId) {
      const mod = trainingModules.find((m) => m.id === itemId);
      if (mod) setSelectedTrainingCategoryId(mod.categoryId);
      setSelectedTrainingModuleId(itemId);
    } else if (section !== 'training') {
      setSelectedTrainingModuleId(null);
    }

    if (section === 'sops' && itemId) {
      const sop = sopDocuments.find((s) => s.id === itemId);
      if (sop) setSelectedSopCategoryId(sop.categoryId);
      setSelectedSopId(itemId);
    } else if (section !== 'sops') {
      setSelectedSopId(null);
    }
  };

  const handleJumpToSop = (sopCode: string) => {
    const clean = sopCode.trim().toLowerCase();
    const match = sopDocuments.find(
      (s) => s.sopCode.toLowerCase() === clean || s.sopCode.toLowerCase().includes(clean)
    );
    if (match) {
      setSelectedSopCategoryId(match.categoryId);
      setSelectedSopId(match.id);
    }
    setActiveSection('sops');
  };

  const publishedAnnouncements = useMemo(
    () =>
      announcements
        .filter((a) => a.status === 'published')
        .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate)),
    [announcements]
  );

  const highPriorityCount = publishedAnnouncements.filter((a) => a.priority === 'High').length;

  const activeNavMeta = NAV_ITEMS.find((n) => n.id === activeSection) || NAV_ITEMS[0];

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    if (activeSection === 'dashboard') {
      return [{ label: 'Dashboard Overview', isCurrent: true }];
    }

    if (activeSection === 'training') {
      const activeModule = selectedTrainingModuleId
        ? trainingModules.find((m) => m.id === selectedTrainingModuleId) || null
        : null;
      const effectiveCategoryId =
        selectedTrainingCategoryId || activeModule?.categoryId || null;
      const activeCategory = effectiveCategoryId
        ? trainingCategories.find((c) => c.id === effectiveCategoryId) || null
        : null;

      const trail: BreadcrumbItem[] = [
        {
          label: 'Retail Training Centre',
          onClick:
            activeCategory || activeModule
              ? () => {
                  setSelectedTrainingCategoryId(null);
                  setSelectedTrainingModuleId(null);
                }
              : undefined,
          isCurrent: !activeCategory && !activeModule,
        },
      ];

      if (activeCategory) {
        trail.push({
          label: `${activeCategory.code}. ${activeCategory.title}`,
          onClick: activeModule
            ? () => {
                setSelectedTrainingCategoryId(activeCategory.id);
                setSelectedTrainingModuleId(null);
              }
            : undefined,
          isCurrent: !activeModule,
        });
      }

      if (activeModule) {
        trail.push({
          label: activeModule.title,
          isCurrent: true,
        });
      }

      return trail;
    }

    if (activeSection === 'sops') {
      const activeSop = selectedSopId
        ? sopDocuments.find((s) => s.id === selectedSopId) || null
        : null;
      const effectiveCategoryId =
        selectedSopCategoryId || activeSop?.categoryId || null;
      const activeCategory = effectiveCategoryId
        ? sopCategories.find((c) => c.id === effectiveCategoryId) || null
        : null;

      const trail: BreadcrumbItem[] = [
        {
          label: 'Retail Operational SOP',
          onClick:
            activeCategory || activeSop
              ? () => {
                  setSelectedSopCategoryId(null);
                  setSelectedSopId(null);
                }
              : undefined,
          isCurrent: !activeCategory && !activeSop,
        },
      ];

      if (activeCategory) {
        trail.push({
          label: `${activeCategory.code}. ${activeCategory.title}`,
          onClick: activeSop
            ? () => {
                setSelectedSopCategoryId(activeCategory.id);
                setSelectedSopId(null);
              }
            : undefined,
          isCurrent: !activeSop,
        });
      }

      if (activeSop) {
        trail.push({
          label: `${activeSop.sopCode} — ${activeSop.title}`,
          isCurrent: true,
        });
      }

      return trail;
    }

    return [{ label: activeNavMeta.label, isCurrent: true }];
  }, [
    activeSection,
    activeNavMeta.label,
    selectedTrainingCategoryId,
    selectedTrainingModuleId,
    trainingCategories,
    trainingModules,
    selectedSopCategoryId,
    selectedSopId,
    sopCategories,
    sopDocuments,
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-zinc-200 z-30">
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          {NAV_ITEMS.filter(
            (item) => !item.requiresManagement || canManageContent(userProfile.role)
          ).map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-200">
          <button
            type="button"
            onClick={() => {
              setProfileDraft({
                displayName: userProfile.displayName,
                outletName: userProfile.outletName,
                department: userProfile.department,
              });
              setProfileModalOpen(true);
            }}
            className="w-full p-2.5 rounded-lg hover:bg-zinc-50 flex items-center gap-3 text-left transition-colors cursor-pointer"
          >
            <img
              src="/src/assets/images/avatar_retail_lead_1795408356576.jpg"
              alt={userProfile.displayName}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-zinc-200 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-900 truncate">
                {userProfile.displayName}
              </p>
              <p className="text-xs text-zinc-500 truncate">
                {userProfile.outletName || getRoleLabel(userProfile.role)}
              </p>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-zinc-950/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full border-r border-zinc-200 flex flex-col z-10">
            <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.filter(
                (item) => !item.requiresManagement || canManageContent(userProfile.role)
              ).map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-left cursor-pointer ${
                      isActive
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <p className="text-xs text-zinc-500 hidden sm:block truncate">
                  Khatam Retail Learning &amp; Operations Hub
                </p>
                <p className="text-sm font-semibold text-zinc-900 truncate">
                  {activeNavMeta.label}
                </p>
              </div>
            </div>

            {/* Global Search Trigger */}
            <div className="flex-1 max-w-md hidden md:block">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="w-full px-3.5 py-2 text-left text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg hover:border-zinc-400 flex items-center justify-between gap-2 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 truncate">
                  <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">
                    Search SOP, Training, Guidelines or Quick Links...
                  </span>
                </span>
                <kbd className="font-mono text-[11px] text-zinc-400 border border-zinc-200 bg-white rounded px-1.5 py-0.5 shrink-0">
                  ⌘K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0 relative">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="md:hidden p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                aria-label="Search Hub"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setNotificationsOpen((v) => !v)}
                className="relative p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
                aria-label="Important updates and notifications"
              >
                <Bell className="w-5 h-5" />
                {highPriorityCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-mono font-semibold flex items-center justify-center">
                    {highPriorityCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-zinc-200 rounded-xl shadow-lg p-4 z-40">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-100">
                    <span className="text-xs font-semibold text-zinc-900">
                      Recent Management Updates
                    </span>
                    <button
                      type="button"
                      onClick={() => handleNavigate('announcements')}
                      className="text-xs font-medium text-[#78561D] hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  <div className="divide-y divide-zinc-100 max-h-72 overflow-y-auto">
                    {publishedAnnouncements.slice(0, 4).map((ann) => (
                      <button
                        key={ann.id}
                        type="button"
                        onClick={() => handleNavigate('announcements', ann.id)}
                        className="w-full text-left py-2.5 hover:bg-zinc-50 rounded px-1.5 -mx-1.5 cursor-pointer"
                      >
                        <p className="text-[11px] font-mono text-zinc-500">
                          {ann.priority} · {ann.publishedDate}
                        </p>
                        <p className="text-xs font-semibold text-zinc-900 mt-0.5">
                          {ann.title}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Breadcrumb Bar */}
        <BreadcrumbBar
          items={breadcrumbItems}
          activeSection={activeSection}
          onNavigateDashboard={() => {
            setSelectedTrainingCategoryId(null);
            setSelectedTrainingModuleId(null);
            setSelectedSopCategoryId(null);
            setSelectedSopId(null);
            handleNavigate('dashboard');
          }}
        />

        {/* Viewport Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeSection === 'dashboard' && (
            <DashboardView
              userProfile={userProfile}
              trainingCategories={trainingCategories}
              trainingModules={trainingModules}
              sopCategories={sopCategories}
              sopDocuments={sopDocuments}
              quickLinks={quickLinks}
              announcements={announcements}
              versionHistory={versionHistory}
              progressItems={progressItems}
              onNavigate={handleNavigate}
              onSelectTrainingCategory={(id) => setSelectedTrainingCategoryId(id)}
              onSelectSopCategory={(id) => setSelectedSopCategoryId(id)}
              onOpenSearch={() => setSearchOpen(true)}
            />
          )}

          {activeSection === 'training' && (
            <TrainingCentreView
              userProfile={userProfile}
              categories={trainingCategories}
              modules={trainingModules}
              progressItems={progressItems}
              selectedCategoryId={selectedTrainingCategoryId}
              selectedModuleId={selectedTrainingModuleId}
              onSelectCategory={setSelectedTrainingCategoryId}
              onSelectModule={setSelectedTrainingModuleId}
              onToggleComplete={(mod, done) =>
                handleToggleLocalProgress('training', mod.id, mod.title, done)
              }
              onJumpToSop={handleJumpToSop}
              onNavigate={handleNavigate}
            />
          )}

          {activeSection === 'sops' && (
            <SopLibraryView
              userProfile={userProfile}
              categories={sopCategories}
              sops={sopDocuments}
              progressItems={progressItems}
              selectedCategoryId={selectedSopCategoryId}
              selectedSopId={selectedSopId}
              onSelectCategory={setSelectedSopCategoryId}
              onSelectSop={setSelectedSopId}
              onToggleAcknowledge={(sop, ack) =>
                handleToggleLocalProgress(
                  'sop',
                  sop.id,
                  `${sop.sopCode} — ${sop.title}`,
                  ack
                )
              }
              onNavigate={handleNavigate}
            />
          )}

          {activeSection === 'quick-links' && (
            <QuickLinksView
              userProfile={userProfile}
              quickLinks={quickLinks}
              highlightedId={highlightedItemId}
              onNavigate={handleNavigate}
            />
          )}

          {activeSection === 'forms' && (
            <FormsLibraryView
              userProfile={userProfile}
              forms={formsTemplates}
              highlightedId={highlightedItemId}
              onNavigate={handleNavigate}
            />
          )}

          {activeSection === 'faq' && (
            <FaqView
              userProfile={userProfile}
              faqs={faqs}
              highlightedId={highlightedItemId}
              onJumpToSop={handleJumpToSop}
              onNavigate={handleNavigate}
            />
          )}

          {activeSection === 'announcements' && (
            <AnnouncementsView
              userProfile={userProfile}
              announcements={announcements}
              highlightedId={highlightedItemId}
              onNavigate={handleNavigate}
            />
          )}

          {activeSection === 'admin' && (
            <AdminManagementView
              userProfile={userProfile}
              isPrimaryAdmin={false}
              trainingCategories={trainingCategories}
              trainingModules={trainingModules}
              sopCategories={sopCategories}
              sopDocuments={sopDocuments}
              quickLinks={quickLinks}
              formsTemplates={formsTemplates}
              faqs={faqs}
              announcements={announcements}
              versionHistory={versionHistory}
              roles={roles}
              usersList={[]}
            />
          )}
        </main>

        <footer className="border-t border-zinc-200 bg-white mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
            <span>Khatam Retail Learning &amp; Operations Hub</span>
            <span>One Platform. One Standard. Better Retail Operations.</span>
          </div>
        </footer>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchOpen}
        initialQuery={headerSearchInput}
        onClose={() => {
          setSearchOpen(false);
          setHeaderSearchInput('');
        }}
        trainingModules={trainingModules.filter((m) => m.status === 'published')}
        sopDocuments={sopDocuments.filter((s) => s.status === 'published')}
        quickLinks={quickLinks.filter((l) => l.status === 'published')}
        formsTemplates={formsTemplates.filter((f) => f.status === 'published')}
        faqs={faqs.filter((f) => f.status === 'published')}
        onNavigate={handleNavigate}
      />

      {/* Outlet / Workspace Preferences Modal */}
      {profileModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Outlet Preferences"
        >
          <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">Outlet Preferences</h2>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 cursor-pointer"
                aria-label="Close preferences dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              className="p-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const updated: UserProfile = {
                  ...userProfile,
                  displayName: profileDraft.displayName.trim() || DEFAULT_WORKSPACE_PROFILE.displayName,
                  outletName: profileDraft.outletName.trim() || DEFAULT_WORKSPACE_PROFILE.outletName,
                  department: profileDraft.department.trim() || DEFAULT_WORKSPACE_PROFILE.department,
                };
                setUserProfile(updated);
                try {
                  localStorage.setItem(WORKSPACE_PROFILE_STORAGE_KEY, JSON.stringify(updated));
                } catch {
                  // Ignore storage quota errors
                }
                setProfileModalOpen(false);
              }}
            >
              <label className="block">
                <span className="text-xs font-medium text-zinc-700 block mb-1">Display Name</span>
                <input
                  type="text"
                  required
                  value={profileDraft.displayName}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, displayName: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-zinc-700 block mb-1">Outlet Name</span>
                <input
                  type="text"
                  value={profileDraft.outletName}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, outletName: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-zinc-700 block mb-1">Department</span>
                <input
                  type="text"
                  value={profileDraft.department}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, department: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400"
                />
              </label>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 cursor-pointer"
                >
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
