import { useState } from 'react';
import {
  Archive,
  Check,
  Clock,
  Edit3,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import type {
  Announcement,
  AnnouncementCategory,
  AnnouncementPriority,
  ContentStatus,
  FaqEntry,
  FormCategory,
  FormFormatType,
  FormTemplate,
  QuickLink,
  QuickLinkCategory,
  RoleCode,
  RoleDefinition,
  SopCategory,
  SopDocument,
  TrainingCategory,
  TrainingModule,
  UserProfile,
  VersionHistoryEntry,
} from '../types/hub';
import {
  adminUpdateUser,
  removeDocument,
  saveAnnouncement,
  saveFaq,
  saveFormTemplate,
  saveQuickLink,
  saveSopCategory,
  saveSopDocument,
  saveTrainingCategory,
  saveTrainingModule,
  seedHubCatalog,
  setDocumentStatus,
} from '../services/hubFirestore';
import {
  calculateSopReadingMinutes,
  calculateTrainingReadingMinutes,
  canManageContent,
  canManageUsers,
  formatFirestoreDate,
  formatReadingTime,
  getRoleLabel,
  getSopReadingMinutes,
  getTrainingReadingMinutes,
} from '../utils/formatters';

interface AdminManagementViewProps {
  userProfile: UserProfile;
  isPrimaryAdmin: boolean;
  trainingCategories: TrainingCategory[];
  trainingModules: TrainingModule[];
  sopCategories: SopCategory[];
  sopDocuments: SopDocument[];
  quickLinks: QuickLink[];
  formsTemplates: FormTemplate[];
  faqs: FaqEntry[];
  announcements: Announcement[];
  versionHistory: VersionHistoryEntry[];
  roles: RoleDefinition[];
  usersList: UserProfile[];
}

type AdminTab =
  | 'training'
  | 'sops'
  | 'quick-links'
  | 'forms'
  | 'faq-announcements'
  | 'history'
  | 'users';

export function AdminManagementView({
  userProfile,
  isPrimaryAdmin,
  trainingCategories,
  trainingModules,
  sopCategories,
  sopDocuments,
  quickLinks,
  formsTemplates,
  faqs,
  announcements,
  versionHistory,
  roles,
  usersList,
}: AdminManagementViewProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('sops');
  const [statusFilter, setStatusFilter] = useState<'all' | ContentStatus>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Modals / Forms state
  const [editingTraining, setEditingTraining] = useState<Partial<TrainingModule> & { isNew?: boolean } | null>(null);
  const [editingTrainingCat, setEditingTrainingCat] = useState<Partial<TrainingCategory> & { isNew?: boolean } | null>(null);
  const [editingSop, setEditingSop] = useState<(Partial<SopDocument> & { isNew?: boolean; changeSummary?: string }) | null>(null);
  const [editingSopCat, setEditingSopCat] = useState<Partial<SopCategory> & { isNew?: boolean } | null>(null);
  const [editingLink, setEditingLink] = useState<Partial<QuickLink> & { isNew?: boolean } | null>(null);
  const [editingForm, setEditingForm] = useState<Partial<FormTemplate> & { isNew?: boolean } | null>(null);
  const [editingFaq, setEditingFaq] = useState<Partial<FaqEntry> & { isNew?: boolean } | null>(null);
  const [editingAnn, setEditingAnn] = useState<Partial<Announcement> & { isNew?: boolean } | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  if (!canManageContent(userProfile.role)) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
        <Shield className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
        <h1 className="text-lg font-semibold text-zinc-900 mb-1">
          Management Access Required
        </h1>
        <p className="text-sm text-zinc-600">
          Only System Administrators and Retail Management can edit hub modules, SOPs, links, and announcements.
        </p>
      </div>
    );
  }

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleSeedRestore = async () => {
    setBusy(true);
    try {
      await seedHubCatalog(userProfile.uid, userProfile.displayName);
      notify('Default Khatam Retail catalog initialized.');
    } finally {
      setBusy(false);
    }
  };

  const filterByStatus = <T extends { status: ContentStatus }>(items: T[]) =>
    statusFilter === 'all' ? items : items.filter((i) => i.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Admin Content &amp; Access Management
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Manage training materials, approve SOP versions, configure Google Drive / Form URLs, and govern role access.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSeedRestore}
          disabled={busy}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
          Sync / Restore Default Catalog
        </button>
      </div>

      {toast && (
        <div
          role="status"
          className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900 flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-emerald-700" />
          {toast}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(
          [
            ['sops', `SOP Documents (${sopDocuments.length})`],
            ['training', `Training Modules (${trainingModules.length})`],
            ['quick-links', `Quick Links (${quickLinks.length})`],
            ['forms', `Forms & Templates (${formsTemplates.length})`],
            ['faq-announcements', `FAQs & Announcements`],
            ['history', `Version History (${versionHistory.length})`],
            ...(canManageUsers(userProfile.role) ? [['users', 'User Access & Roles']] : []),
          ] as Array<[AdminTab, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === key
                ? 'bg-zinc-900 text-white'
                : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Status Filter Bar for Content Tabs */}
      {activeTab !== 'history' && activeTab !== 'users' && (
        <div className="flex items-center justify-between gap-4 bg-white border border-zinc-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-500 mr-1">Filter status:</span>
            {(['all', 'published', 'draft', 'archived'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize cursor-pointer ${
                  statusFilter === st
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          {!isPrimaryAdmin && (
            <span className="text-xs text-zinc-500">
              Showing published items visible to management.
            </span>
          )}
        </div>
      )}

      {/* TAB: SOP DOCUMENTS */}
      {activeTab === 'sops' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-900">
              SOP Categories ({sopCategories.length}) &amp; Documents ({sopDocuments.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setEditingSopCat({
                    isNew: true,
                    id: `cat_sop_${Date.now()}`,
                    code: String.fromCharCode(65 + sopCategories.length),
                    title: '',
                    description: '',
                    iconName: 'FileText',
                    sortOrder: sopCategories.length + 1,
                    isActive: true,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New SOP Category
              </button>
              <button
                type="button"
                onClick={() =>
                  setEditingSop({
                    isNew: true,
                    id: `sop_${Date.now()}`,
                    sopCode: 'SOP-NEW-001',
                    title: '',
                    categoryId: sopCategories[0]?.id || '',
                    purpose: '',
                    scope: 'All Khatam Retail outlets and retail team members.',
                    personInCharge: 'Outlet Supervisor & Team Leader',
                    procedures: ['Step 1: Enter approved operational procedure.'],
                    reminders: ['Verify effective date before floor execution.'],
                    relatedDocuments: '',
                    pdfUrl: '',
                    version: '1.0',
                    relatedTrainingTitle: '',
                    approvalStatus: 'Management Approved',
                    status: 'published',
                    changeSummary: 'Initial SOP publication',
                  })
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add SOP Document
              </button>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
                    <th className="py-3 px-4 font-medium">Code</th>
                    <th className="py-3 px-4 font-medium">Title</th>
                    <th className="py-3 px-4 font-medium">Est. Read</th>
                    <th className="py-3 px-4 font-medium">Approval</th>
                    <th className="py-3 px-4 font-medium">Version</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm">
                  {filterByStatus(sopDocuments)
                    .slice()
                    .sort((a, b) => a.sopCode.localeCompare(b.sopCode))
                    .map((sop) => (
                      <tr key={sop.id} className="hover:bg-zinc-50/70">
                        <td className="py-2.5 px-4 font-mono text-xs text-zinc-600">{sop.sopCode}</td>
                        <td className="py-2.5 px-4 font-medium text-zinc-900">{sop.title}</td>
                        <td className="py-2.5 px-4 font-mono text-xs tabular-nums text-zinc-600 whitespace-nowrap">
                          {formatReadingTime(getSopReadingMinutes(sop))}
                        </td>
                        <td className="py-2.5 px-4 text-xs text-zinc-600">{sop.approvalStatus}</td>
                        <td className="py-2.5 px-4 font-mono text-xs text-zinc-600">v{sop.version}</td>
                        <td className="py-2.5 px-4 text-xs capitalize text-zinc-600">{sop.status}</td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap space-x-2">
                          <button
                            type="button"
                            onClick={() => setEditingSop({ ...sop, isNew: false, changeSummary: '' })}
                            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-800 hover:text-[#78561D] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await setDocumentStatus(
                                'sopDocuments',
                                sop.id,
                                sop.status === 'archived' ? 'published' : 'archived',
                                userProfile.uid
                              );
                              notify(sop.status === 'archived' ? 'SOP restored to published.' : 'SOP archived.');
                            }}
                            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            {sop.status === 'archived' ? 'Restore' : 'Archive'}
                          </button>
                          {canManageUsers(userProfile.role) && (
                            <button
                              type="button"
                              onClick={async () => {
                                await removeDocument('sopDocuments', sop.id);
                                notify('SOP deleted.');
                              }}
                              className="inline-flex items-center gap-1 text-xs text-red-700 hover:underline cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: TRAINING MODULES */}
      {activeTab === 'training' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-900">
              Training Categories ({trainingCategories.length}) &amp; Modules ({trainingModules.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setEditingTrainingCat({
                    isNew: true,
                    id: `cat_trn_${Date.now()}`,
                    code: String.fromCharCode(65 + trainingCategories.length),
                    title: '',
                    description: '',
                    iconName: 'BookOpen',
                    sortOrder: trainingCategories.length + 1,
                    isActive: true,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Training Category
              </button>
              <button
                type="button"
                onClick={() =>
                  setEditingTraining({
                    isNew: true,
                    id: `trn_${Date.now()}`,
                    categoryId: trainingCategories[0]?.id || '',
                    title: '',
                    description: '',
                    learningObjectives: ['Understand core operational workflow'],
                    materialsSummary: '',
                    pdfUrl: '',
                    videoUrl: '',
                    driveUrl: '',
                    relatedSopCode: '',
                    relatedFormTitle: '',
                    quizUrl: '',
                    status: 'published',
                  })
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Training Module
              </button>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
                    <th className="py-3 px-4 font-medium">Module Title</th>
                    <th className="py-3 px-4 font-medium">Category</th>
                    <th className="py-3 px-4 font-medium">Est. Read</th>
                    <th className="py-3 px-4 font-medium">Linked Materials</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm">
                  {filterByStatus(trainingModules).map((mod) => {
                    const cat = trainingCategories.find((c) => c.id === mod.categoryId);
                    const linksCount = [mod.pdfUrl, mod.videoUrl, mod.driveUrl, mod.quizUrl].filter(Boolean).length;
                    return (
                      <tr key={mod.id} className="hover:bg-zinc-50/70">
                        <td className="py-2.5 px-4 font-medium text-zinc-900">{mod.title}</td>
                        <td className="py-2.5 px-4 text-xs text-zinc-600">{cat?.title || mod.categoryId}</td>
                        <td className="py-2.5 px-4 font-mono text-xs tabular-nums text-zinc-600 whitespace-nowrap">
                          {formatReadingTime(getTrainingReadingMinutes(mod))}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-xs text-zinc-600">{linksCount}/4 URLs set</td>
                        <td className="py-2.5 px-4 text-xs capitalize text-zinc-600">{mod.status}</td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap space-x-2">
                          <button
                            type="button"
                            onClick={() => setEditingTraining({ ...mod, isNew: false })}
                            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-800 hover:text-[#78561D] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await setDocumentStatus(
                                'trainingModules',
                                mod.id,
                                mod.status === 'archived' ? 'published' : 'archived',
                                userProfile.uid
                              );
                              notify('Training module status updated.');
                            }}
                            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            {mod.status === 'archived' ? 'Restore' : 'Archive'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: QUICK LINKS */}
      {activeTab === 'quick-links' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-900">
              Configurable Quick Links ({quickLinks.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                setEditingLink({
                  isNew: true,
                  id: `ql_${Date.now()}`,
                  title: '',
                  description: '',
                  category: 'Sales & Reporting',
                  url: '',
                  iconName: 'ExternalLink',
                  accessInstructions: '',
                  status: 'published',
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Quick Link
            </button>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
                    <th className="py-3 px-4 font-medium">Title</th>
                    <th className="py-3 px-4 font-medium">Category</th>
                    <th className="py-3 px-4 font-medium">Target URL</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm">
                  {filterByStatus(quickLinks).map((link) => (
                    <tr key={link.id} className="hover:bg-zinc-50/70">
                      <td className="py-2.5 px-4 font-medium text-zinc-900">{link.title}</td>
                      <td className="py-2.5 px-4 text-xs text-zinc-600">{link.category}</td>
                      <td className="py-2.5 px-4 text-xs font-mono text-zinc-500 max-w-xs truncate">
                        {link.url || 'Pending URL setup'}
                      </td>
                      <td className="py-2.5 px-4 text-xs capitalize text-zinc-600">{link.status}</td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingLink({ ...link, isNew: false })}
                          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-800 hover:text-[#78561D] cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Configure
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await setDocumentStatus(
                              'quickLinks',
                              link.id,
                              link.status === 'archived' ? 'published' : 'archived',
                              userProfile.uid
                            );
                            notify('Quick link status updated.');
                          }}
                          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          {link.status === 'archived' ? 'Restore' : 'Archive'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: FORMS & TEMPLATES */}
      {activeTab === 'forms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-900">
              Forms &amp; Templates ({formsTemplates.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                setEditingForm({
                  isNew: true,
                  id: `frm_${Date.now()}`,
                  title: '',
                  description: '',
                  category: 'Daily Operations Forms',
                  formatType: 'Google Form',
                  url: '',
                  status: 'published',
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Form / Template
            </button>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
                    <th className="py-3 px-4 font-medium">Title</th>
                    <th className="py-3 px-4 font-medium">Category</th>
                    <th className="py-3 px-4 font-medium">Format</th>
                    <th className="py-3 px-4 font-medium">URL</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm">
                  {filterByStatus(formsTemplates).map((frm) => (
                    <tr key={frm.id} className="hover:bg-zinc-50/70">
                      <td className="py-2.5 px-4 font-medium text-zinc-900">{frm.title}</td>
                      <td className="py-2.5 px-4 text-xs text-zinc-600">{frm.category}</td>
                      <td className="py-2.5 px-4 text-xs font-mono text-zinc-600">{frm.formatType}</td>
                      <td className="py-2.5 px-4 text-xs font-mono text-zinc-500 max-w-xs truncate">
                        {frm.url || 'Pending URL setup'}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingForm({ ...frm, isNew: false })}
                          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-800 hover:text-[#78561D] cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await setDocumentStatus(
                              'formsTemplates',
                              frm.id,
                              frm.status === 'archived' ? 'published' : 'archived',
                              userProfile.uid
                            );
                            notify('Form template status updated.');
                          }}
                          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          {frm.status === 'archived' ? 'Restore' : 'Archive'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: FAQS & ANNOUNCEMENTS */}
      {activeTab === 'faq-announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-zinc-900">FAQs ({faqs.length})</h2>
              <button
                type="button"
                onClick={() =>
                  setEditingFaq({
                    isNew: true,
                    id: `faq_${Date.now()}`,
                    question: '',
                    answer: '',
                    category: 'Daily Operations',
                    sopRef: '',
                    quickLinkUrl: '',
                    quickLinkLabel: '',
                    status: 'published',
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add FAQ
              </button>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
              {filterByStatus(faqs).map((faq) => (
                <div key={faq.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900">{faq.question}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {faq.category} · {faq.status}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingFaq({ ...faq, isNew: false })}
                    className="text-xs font-medium text-zinc-800 hover:text-[#78561D] shrink-0 cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-zinc-900">
                Announcements ({announcements.length})
              </h2>
              <button
                type="button"
                onClick={() =>
                  setEditingAnn({
                    isNew: true,
                    id: `ann_${Date.now()}`,
                    title: '',
                    description: '',
                    category: 'Operational',
                    priority: 'Normal',
                    relatedUrl: '',
                    relatedLabel: '',
                    publishedDate: new Date().toISOString().slice(0, 10),
                    status: 'published',
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Publish Notice
              </button>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
              {filterByStatus(announcements).map((ann) => (
                <div key={ann.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900">{ann.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {ann.priority} · {ann.category} · {ann.publishedDate} · {ann.status}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingAnn({ ...ann, isNew: false })}
                    className="text-xs font-medium text-zinc-800 hover:text-[#78561D] shrink-0 cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: VERSION HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium">Document / Resource</th>
                  <th className="py-3 px-4 font-medium">Version</th>
                  <th className="py-3 px-4 font-medium">Change Summary</th>
                  <th className="py-3 px-4 font-medium">Updated By</th>
                  <th className="py-3 px-4 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {versionHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-4 text-xs uppercase font-mono text-zinc-500">
                      {item.entityType}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-zinc-900">{item.entityTitle}</td>
                    <td className="py-2.5 px-4 font-mono text-xs text-zinc-600">{item.version}</td>
                    <td className="py-2.5 px-4 text-xs text-zinc-600">{item.changeSummary}</td>
                    <td className="py-2.5 px-4 text-xs text-zinc-600">{item.changedByName}</td>
                    <td className="py-2.5 px-4 text-xs font-mono tabular-nums text-zinc-500 text-right">
                      {formatFirestoreDate(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: USER ACCESS & ROLES */}
      {activeTab === 'users' && canManageUsers(userProfile.role) && (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-zinc-900 mb-3">
              Khatam Retail Role Matrix
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {roles
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((r) => (
                  <div key={r.id} className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200">
                    <p className="text-xs font-mono font-semibold text-[#78561D]">{r.code}</p>
                    <p className="text-sm font-semibold text-zinc-900 mt-0.5">
                      {r.code === 'OUTLET_MANAGER' ? getRoleLabel(r.code) : r.label}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{r.description}</p>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">
                Registered Employees ({usersList.length})
              </h2>
            </div>
            {usersList.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Employee records appear automatically when team members sign in with Google Workspace.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
                      <th className="py-3 px-4 font-medium">Employee</th>
                      <th className="py-3 px-4 font-medium">Outlet</th>
                      <th className="py-3 px-4 font-medium">Department</th>
                      <th className="py-3 px-4 font-medium">Role</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium text-right">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-sm">
                    {usersList.map((u) => (
                      <tr key={u.uid}>
                        <td className="py-2.5 px-4 font-medium text-zinc-900">{u.displayName}</td>
                        <td className="py-2.5 px-4 text-xs text-zinc-600">{u.outletName}</td>
                        <td className="py-2.5 px-4 text-xs text-zinc-600">{u.department}</td>
                        <td className="py-2.5 px-4 text-xs text-zinc-700">
                          <span className="font-medium text-zinc-900">{getRoleLabel(u.role)}</span>
                          <span className="ml-1.5 font-mono text-[11px] text-zinc-500">({u.role})</span>
                        </td>
                        <td className="py-2.5 px-4 text-xs capitalize text-zinc-600">{u.status}</td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingUser(u)}
                            className="text-xs font-medium text-zinc-900 hover:text-[#78561D] cursor-pointer"
                          >
                            Edit Role
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- EDIT MODALS --- */}

      {/* Edit SOP Modal */}
      {editingSop && (
        <ModalFrame
          title={editingSop.isNew ? 'Create SOP Document' : `Edit ${editingSop.sopCode}`}
          onClose={() => setEditingSop(null)}
        >
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await saveSopDocument(
                {
                  id: editingSop.id || `sop_${Date.now()}`,
                  sopCode: editingSop.sopCode || 'SOP-001',
                  title: editingSop.title || 'Untitled SOP',
                  categoryId: editingSop.categoryId || sopCategories[0]?.id || '',
                  purpose: editingSop.purpose || '',
                  scope: editingSop.scope || '',
                  personInCharge: editingSop.personInCharge || '',
                  procedures: editingSop.procedures || [],
                  reminders: editingSop.reminders || [],
                  relatedDocuments: editingSop.relatedDocuments || '',
                  pdfUrl: editingSop.pdfUrl || '',
                  version: editingSop.version || '1.0',
                  relatedTrainingTitle: editingSop.relatedTrainingTitle || '',
                  approvalStatus: editingSop.approvalStatus || 'Placeholder Template',
                  status: editingSop.status || 'published',
                  updatedBy: userProfile.uid,
                },
                userProfile.uid,
                userProfile.displayName,
                Boolean(editingSop.isNew),
                editingSop.changeSummary
              );
              setEditingSop(null);
              notify('SOP document saved and version logged.');
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <InputField
                label="SOP Reference Code"
                required
                value={editingSop.sopCode || ''}
                onChange={(v) => setEditingSop({ ...editingSop, sopCode: v })}
              />
              <InputField
                label="Version Number"
                required
                value={editingSop.version || ''}
                onChange={(v) => setEditingSop({ ...editingSop, version: v })}
              />
              <SelectField
                label="Approval Status"
                value={editingSop.approvalStatus || 'Placeholder Template'}
                options={[
                  { value: 'Placeholder Template', label: 'Placeholder Template' },
                  { value: 'Management Approved', label: 'Management Approved' },
                ]}
                onChange={(v) =>
                  setEditingSop({
                    ...editingSop,
                    approvalStatus: v as SopDocument['approvalStatus'],
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField
                label="SOP Title"
                required
                value={editingSop.title || ''}
                onChange={(v) => setEditingSop({ ...editingSop, title: v })}
              />
              <SelectField
                label="Category"
                value={editingSop.categoryId || ''}
                options={sopCategories.map((c) => ({ value: c.id, label: `${c.code}. ${c.title}` }))}
                onChange={(v) => setEditingSop({ ...editingSop, categoryId: v })}
              />
            </div>

            <TextAreaField
              label="Purpose"
              value={editingSop.purpose || ''}
              onChange={(v) => setEditingSop({ ...editingSop, purpose: v })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField
                label="Scope"
                value={editingSop.scope || ''}
                onChange={(v) => setEditingSop({ ...editingSop, scope: v })}
              />
              <InputField
                label="Person in Charge"
                value={editingSop.personInCharge || ''}
                onChange={(v) => setEditingSop({ ...editingSop, personInCharge: v })}
              />
            </div>

            <TextAreaField
              label="Step-by-Step Procedures (one step per line)"
              rows={4}
              value={(editingSop.procedures || []).join('\n')}
              onChange={(v) =>
                setEditingSop({ ...editingSop, procedures: v.split('\n') })
              }
            />

            <TextAreaField
              label="Important Reminders (one per line)"
              rows={2}
              value={(editingSop.reminders || []).join('\n')}
              onChange={(v) =>
                setEditingSop({ ...editingSop, reminders: v.split('\n') })
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField
                label="Approved PDF URL (Google Drive / Storage)"
                placeholder="https://drive.google.com/..."
                value={editingSop.pdfUrl || ''}
                onChange={(v) => setEditingSop({ ...editingSop, pdfUrl: v })}
              />
              <InputField
                label="Related Training Module"
                value={editingSop.relatedTrainingTitle || ''}
                onChange={(v) => setEditingSop({ ...editingSop, relatedTrainingTitle: v })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField
                label="Publication Status"
                value={editingSop.status || 'published'}
                options={[
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'archived', label: 'Archived' },
                ]}
                onChange={(v) => setEditingSop({ ...editingSop, status: v as ContentStatus })}
              />
              <InputField
                label="Version Change Summary"
                placeholder="e.g., Uploaded approved cash handling steps"
                value={editingSop.changeSummary || ''}
                onChange={(v) => setEditingSop({ ...editingSop, changeSummary: v })}
              />
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-3 text-xs">
              <span className="text-zinc-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#9A732E]" />
                Estimated Reading Time (auto-calculated from SOP content length)
              </span>
              <span className="font-mono font-semibold text-zinc-900 tabular-nums whitespace-nowrap">
                {formatReadingTime(calculateSopReadingMinutes(editingSop))}
              </span>
            </div>

            <ModalActions onCancel={() => setEditingSop(null)} />
          </form>
        </ModalFrame>
      )}

      {/* Edit SOP Category Modal */}
      {editingSopCat && (
        <ModalFrame title="SOP Category" onClose={() => setEditingSopCat(null)}>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await saveSopCategory(
                {
                  id: editingSopCat.id || `cat_sop_${Date.now()}`,
                  code: editingSopCat.code || 'I',
                  title: editingSopCat.title || 'New Category',
                  description: editingSopCat.description || '',
                  iconName: editingSopCat.iconName || 'FileText',
                  sortOrder: Number(editingSopCat.sortOrder) || sopCategories.length + 1,
                  isActive: editingSopCat.isActive ?? true,
                },
                Boolean(editingSopCat.isNew)
              );
              setEditingSopCat(null);
              notify('SOP category saved.');
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Code (e.g. I)"
                required
                value={editingSopCat.code || ''}
                onChange={(v) => setEditingSopCat({ ...editingSopCat, code: v })}
              />
              <InputField
                label="Title"
                required
                value={editingSopCat.title || ''}
                onChange={(v) => setEditingSopCat({ ...editingSopCat, title: v })}
              />
            </div>
            <TextAreaField
              label="Description"
              value={editingSopCat.description || ''}
              onChange={(v) => setEditingSopCat({ ...editingSopCat, description: v })}
            />
            <ModalActions onCancel={() => setEditingSopCat(null)} />
          </form>
        </ModalFrame>
      )}

      {/* Edit Training Category Modal */}
      {editingTrainingCat && (
        <ModalFrame title="Training Category" onClose={() => setEditingTrainingCat(null)}>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await saveTrainingCategory(
                {
                  id: editingTrainingCat.id || `cat_trn_${Date.now()}`,
                  code: editingTrainingCat.code || 'H',
                  title: editingTrainingCat.title || 'New Track',
                  description: editingTrainingCat.description || '',
                  iconName: editingTrainingCat.iconName || 'BookOpen',
                  sortOrder: Number(editingTrainingCat.sortOrder) || trainingCategories.length + 1,
                  isActive: editingTrainingCat.isActive ?? true,
                },
                Boolean(editingTrainingCat.isNew)
              );
              setEditingTrainingCat(null);
              notify('Training category saved.');
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Code (e.g. H)"
                required
                value={editingTrainingCat.code || ''}
                onChange={(v) => setEditingTrainingCat({ ...editingTrainingCat, code: v })}
              />
              <InputField
                label="Title"
                required
                value={editingTrainingCat.title || ''}
                onChange={(v) => setEditingTrainingCat({ ...editingTrainingCat, title: v })}
              />
            </div>
            <TextAreaField
              label="Description"
              value={editingTrainingCat.description || ''}
              onChange={(v) => setEditingTrainingCat({ ...editingTrainingCat, description: v })}
            />
            <ModalActions onCancel={() => setEditingTrainingCat(null)} />
          </form>
        </ModalFrame>
      )}

      {/* Edit Training Module Modal */}
      {editingTraining && (
        <ModalFrame
          title={editingTraining.isNew ? 'Add Training Module' : `Edit: ${editingTraining.title}`}
          onClose={() => setEditingTraining(null)}
        >
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await saveTrainingModule(
                {
                  id: editingTraining.id || `trn_${Date.now()}`,
                  categoryId: editingTraining.categoryId || trainingCategories[0]?.id || '',
                  title: editingTraining.title || 'Untitled Module',
                  description: editingTraining.description || '',
                  learningObjectives: editingTraining.learningObjectives || [],
                  materialsSummary: editingTraining.materialsSummary || '',
                  pdfUrl: editingTraining.pdfUrl || '',
                  videoUrl: editingTraining.videoUrl || '',
                  driveUrl: editingTraining.driveUrl || '',
                  relatedSopCode: editingTraining.relatedSopCode || '',
                  relatedFormTitle: editingTraining.relatedFormTitle || '',
                  quizUrl: editingTraining.quizUrl || '',
                  status: editingTraining.status || 'published',
                  updatedBy: userProfile.uid,
                },
                userProfile.uid,
                userProfile.displayName,
                Boolean(editingTraining.isNew)
              );
              setEditingTraining(null);
              notify('Training module saved.');
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField
                label="Module Title"
                required
                value={editingTraining.title || ''}
                onChange={(v) => setEditingTraining({ ...editingTraining, title: v })}
              />
              <SelectField
                label="Training Track"
                value={editingTraining.categoryId || ''}
                options={trainingCategories.map((c) => ({ value: c.id, label: `${c.code}. ${c.title}` }))}
                onChange={(v) => setEditingTraining({ ...editingTraining, categoryId: v })}
              />
            </div>
            <TextAreaField
              label="Short Description"
              value={editingTraining.description || ''}
              onChange={(v) => setEditingTraining({ ...editingTraining, description: v })}
            />
            <TextAreaField
              label="Learning Objectives (one per line)"
              rows={3}
              value={(editingTraining.learningObjectives || []).join('\n')}
              onChange={(v) =>
                setEditingTraining({ ...editingTraining, learningObjectives: v.split('\n') })
              }
            />
            <TextAreaField
              label="Materials Summary"
              rows={2}
              value={editingTraining.materialsSummary || ''}
              onChange={(v) => setEditingTraining({ ...editingTraining, materialsSummary: v })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField
                label="PDF Document URL"
                placeholder="https://..."
                value={editingTraining.pdfUrl || ''}
                onChange={(v) => setEditingTraining({ ...editingTraining, pdfUrl: v })}
              />
              <InputField
                label="Video Reference URL"
                placeholder="https://..."
                value={editingTraining.videoUrl || ''}
                onChange={(v) => setEditingTraining({ ...editingTraining, videoUrl: v })}
              />
              <InputField
                label="Google Drive Folder URL"
                placeholder="https://drive.google.com/..."
                value={editingTraining.driveUrl || ''}
                onChange={(v) => setEditingTraining({ ...editingTraining, driveUrl: v })}
              />
              <InputField
                label="Quiz / Assessment URL"
                placeholder="https://docs.google.com/forms/..."
                value={editingTraining.quizUrl || ''}
                onChange={(v) => setEditingTraining({ ...editingTraining, quizUrl: v })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <InputField
                label="Related SOP Code"
                value={editingTraining.relatedSopCode || ''}
                onChange={(v) => setEditingTraining({ ...editingTraining, relatedSopCode: v })}
              />
              <InputField
                label="Related Form Title"
                value={editingTraining.relatedFormTitle || ''}
                onChange={(v) => setEditingTraining({ ...editingTraining, relatedFormTitle: v })}
              />
              <SelectField
                label="Status"
                value={editingTraining.status || 'published'}
                options={[
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'archived', label: 'Archived' },
                ]}
                onChange={(v) => setEditingTraining({ ...editingTraining, status: v as ContentStatus })}
              />
            </div>
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-3 text-xs">
              <span className="text-zinc-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#9A732E]" />
                Estimated Reading Time (auto-calculated from module content length)
              </span>
              <span className="font-mono font-semibold text-zinc-900 tabular-nums whitespace-nowrap">
                {formatReadingTime(calculateTrainingReadingMinutes(editingTraining))}
              </span>
            </div>
            <ModalActions onCancel={() => setEditingTraining(null)} />
          </form>
        </ModalFrame>
      )}

      {/* Edit Quick Link Modal */}
      {editingLink && (
        <ModalFrame
          title={editingLink.isNew ? 'Add Quick Link' : `Configure: ${editingLink.title}`}
          onClose={() => setEditingLink(null)}
        >
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await saveQuickLink(
                {
                  id: editingLink.id || `ql_${Date.now()}`,
                  title: editingLink.title || 'Untitled Link',
                  description: editingLink.description || '',
                  category: editingLink.category || 'Sales & Reporting',
                  url: editingLink.url || '',
                  iconName: editingLink.iconName || 'ExternalLink',
                  accessInstructions: editingLink.accessInstructions || '',
                  status: editingLink.status || 'published',
                  updatedBy: userProfile.uid,
                },
                userProfile.uid,
                userProfile.displayName,
                Boolean(editingLink.isNew)
              );
              setEditingLink(null);
              notify('Quick link saved.');
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField
                label="Link Title"
                required
                value={editingLink.title || ''}
                onChange={(v) => setEditingLink({ ...editingLink, title: v })}
              />
              <SelectField
                label="Category"
                value={editingLink.category || 'Sales & Reporting'}
                options={[
                  'Sales & Reporting',
                  'Inventory & Stock',
                  'HR & Staff Management',
                  'Visual Merchandising',
                  'Operations & Administration',
                  'Learning & Development',
                ].map((c) => ({ value: c, label: c }))}
                onChange={(v) =>
                  setEditingLink({ ...editingLink, category: v as QuickLinkCategory })
                }
              />
            </div>
            <InputField
              label="Target URL (https://...)"
              placeholder="https://..."
              value={editingLink.url || ''}
              onChange={(v) => setEditingLink({ ...editingLink, url: v })}
            />
            <TextAreaField
              label="Short Description"
              value={editingLink.description || ''}
              onChange={(v) => setEditingLink({ ...editingLink, description: v })}
            />
            <TextAreaField
              label="Optional Access Instructions"
              rows={2}
              value={editingLink.accessInstructions || ''}
              onChange={(v) => setEditingLink({ ...editingLink, accessInstructions: v })}
            />
            <ModalActions onCancel={() => setEditingLink(null)} />
          </form>
        </ModalFrame>
      )}

      {/* Edit Form Template Modal */}
      {editingForm && (
        <ModalFrame
          title={editingForm.isNew ? 'Add Form / Template' : `Edit: ${editingForm.title}`}
          onClose={() => setEditingForm(null)}
        >
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await saveFormTemplate(
                {
                  id: editingForm.id || `frm_${Date.now()}`,
                  title: editingForm.title || 'Untitled Form',
                  description: editingForm.description || '',
                  category: editingForm.category || 'Daily Operations Forms',
                  formatType: editingForm.formatType || 'Google Form',
                  url: editingForm.url || '',
                  status: editingForm.status || 'published',
                  updatedBy: userProfile.uid,
                },
                userProfile.uid,
                userProfile.displayName,
                Boolean(editingForm.isNew)
              );
              setEditingForm(null);
              notify('Form template saved.');
            }}
          >
            <InputField
              label="Form Title"
              required
              value={editingForm.title || ''}
              onChange={(v) => setEditingForm({ ...editingForm, title: v })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField
                label="Category"
                value={editingForm.category || 'Daily Operations Forms'}
                options={[
                  'Daily Operations Forms',
                  'Stock & Inventory Forms',
                  'HR Forms',
                  'Sales Reporting Templates',
                  'VM Checklists',
                  'Incident Reports',
                  'Training Forms',
                ].map((c) => ({ value: c, label: c }))}
                onChange={(v) => setEditingForm({ ...editingForm, category: v as FormCategory })}
              />
              <SelectField
                label="Format Type"
                value={editingForm.formatType || 'Google Form'}
                options={['Google Form', 'Google Sheet', 'Google Doc', 'PDF', 'Excel', 'Word'].map(
                  (f) => ({ value: f, label: f })
                )}
                onChange={(v) =>
                  setEditingForm({ ...editingForm, formatType: v as FormFormatType })
                }
              />
            </div>
            <InputField
              label="Document / Form URL (https://...)"
              placeholder="https://docs.google.com/..."
              value={editingForm.url || ''}
              onChange={(v) => setEditingForm({ ...editingForm, url: v })}
            />
            <TextAreaField
              label="Description"
              value={editingForm.description || ''}
              onChange={(v) => setEditingForm({ ...editingForm, description: v })}
            />
            <ModalActions onCancel={() => setEditingForm(null)} />
          </form>
        </ModalFrame>
      )}

      {/* Edit FAQ Modal */}
      {editingFaq && (
        <ModalFrame
          title={editingFaq.isNew ? 'Add FAQ Entry' : 'Edit FAQ Entry'}
          onClose={() => setEditingFaq(null)}
        >
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await saveFaq(
                {
                  id: editingFaq.id || `faq_${Date.now()}`,
                  question: editingFaq.question || '',
                  answer: editingFaq.answer || '',
                  category: editingFaq.category || 'General',
                  sopRef: editingFaq.sopRef || '',
                  quickLinkUrl: editingFaq.quickLinkUrl || '',
                  quickLinkLabel: editingFaq.quickLinkLabel || '',
                  status: editingFaq.status || 'published',
                  updatedBy: userProfile.uid,
                },
                userProfile.uid,
                userProfile.displayName,
                Boolean(editingFaq.isNew)
              );
              setEditingFaq(null);
              notify('FAQ entry saved.');
            }}
          >
            <InputField
              label="Question"
              required
              value={editingFaq.question || ''}
              onChange={(v) => setEditingFaq({ ...editingFaq, question: v })}
            />
            <TextAreaField
              label="Answer"
              required
              rows={3}
              value={editingFaq.answer || ''}
              onChange={(v) => setEditingFaq({ ...editingFaq, answer: v })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField
                label="Category"
                required
                value={editingFaq.category || ''}
                onChange={(v) => setEditingFaq({ ...editingFaq, category: v })}
              />
              <InputField
                label="Related SOP Code"
                placeholder="e.g., SOP-SIM-003"
                value={editingFaq.sopRef || ''}
                onChange={(v) => setEditingFaq({ ...editingFaq, sopRef: v })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField
                label="Quick Link Label"
                value={editingFaq.quickLinkLabel || ''}
                onChange={(v) => setEditingFaq({ ...editingFaq, quickLinkLabel: v })}
              />
              <InputField
                label="Quick Link URL (optional)"
                placeholder="https://..."
                value={editingFaq.quickLinkUrl || ''}
                onChange={(v) => setEditingFaq({ ...editingFaq, quickLinkUrl: v })}
              />
            </div>
            <ModalActions onCancel={() => setEditingFaq(null)} />
          </form>
        </ModalFrame>
      )}

      {/* Edit Announcement Modal */}
      {editingAnn && (
        <ModalFrame
          title={editingAnn.isNew ? 'Publish Announcement' : 'Edit Announcement'}
          onClose={() => setEditingAnn(null)}
        >
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await saveAnnouncement(
                {
                  id: editingAnn.id || `ann_${Date.now()}`,
                  title: editingAnn.title || '',
                  description: editingAnn.description || '',
                  category: editingAnn.category || 'Operational',
                  priority: editingAnn.priority || 'Normal',
                  relatedUrl: editingAnn.relatedUrl || '',
                  relatedLabel: editingAnn.relatedLabel || '',
                  publishedDate: editingAnn.publishedDate || new Date().toISOString().slice(0, 10),
                  status: editingAnn.status || 'published',
                  updatedBy: userProfile.uid,
                },
                userProfile.uid,
                userProfile.displayName,
                Boolean(editingAnn.isNew)
              );
              setEditingAnn(null);
              notify('Announcement saved.');
            }}
          >
            <InputField
              label="Title"
              required
              value={editingAnn.title || ''}
              onChange={(v) => setEditingAnn({ ...editingAnn, title: v })}
            />
            <TextAreaField
              label="Description"
              required
              rows={3}
              value={editingAnn.description || ''}
              onChange={(v) => setEditingAnn({ ...editingAnn, description: v })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SelectField
                label="Category"
                value={editingAnn.category || 'Operational'}
                options={[
                  'Operational',
                  'New SOP',
                  'Revised Procedure',
                  'Training',
                  'System Maintenance',
                  'Campaign',
                ].map((c) => ({ value: c, label: c }))}
                onChange={(v) =>
                  setEditingAnn({ ...editingAnn, category: v as AnnouncementCategory })
                }
              />
              <SelectField
                label="Priority"
                value={editingAnn.priority || 'Normal'}
                options={['High', 'Normal', 'Low'].map((p) => ({ value: p, label: p }))}
                onChange={(v) =>
                  setEditingAnn({ ...editingAnn, priority: v as AnnouncementPriority })
                }
              />
              <InputField
                label="Publish Date"
                type="date"
                required
                value={editingAnn.publishedDate || ''}
                onChange={(v) => setEditingAnn({ ...editingAnn, publishedDate: v })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField
                label="Related Document Label"
                value={editingAnn.relatedLabel || ''}
                onChange={(v) => setEditingAnn({ ...editingAnn, relatedLabel: v })}
              />
              <InputField
                label="Related Document URL (optional)"
                placeholder="https://..."
                value={editingAnn.relatedUrl || ''}
                onChange={(v) => setEditingAnn({ ...editingAnn, relatedUrl: v })}
              />
            </div>
            <ModalActions onCancel={() => setEditingAnn(null)} />
          </form>
        </ModalFrame>
      )}

      {/* Edit User Access Modal */}
      {editingUser && (
        <ModalFrame
          title={`Manage Access: ${editingUser.displayName}`}
          onClose={() => setEditingUser(null)}
        >
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await adminUpdateUser(editingUser.uid, {
                displayName: editingUser.displayName,
                role: editingUser.role,
                status: editingUser.status,
                outletName: editingUser.outletName,
                department: editingUser.department,
              });
              setEditingUser(null);
              notify('Employee role and outlet access updated.');
            }}
          >
            <InputField
              label="Display Name"
              required
              value={editingUser.displayName}
              onChange={(v) => setEditingUser({ ...editingUser, displayName: v })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField
                label="Assigned Role"
                value={editingUser.role}
                options={[
                  { value: 'ADMIN', label: 'ADMIN — Full Control' },
                  { value: 'RETAIL_MANAGEMENT', label: 'RETAIL_MANAGEMENT — Content & SOPs' },
                  { value: 'AREA_SUPERVISOR', label: 'AREA_SUPERVISOR' },
                  { value: 'OUTLET_MANAGER', label: 'OUTLET_MANAGER — Outlet Supervisor & Team Leader' },
                  { value: 'RETAIL_STAFF', label: 'RETAIL_STAFF' },
                ]}
                onChange={(v) => setEditingUser({ ...editingUser, role: v as RoleCode })}
              />
              <SelectField
                label="Account Status"
                value={editingUser.status}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                onChange={(v) =>
                  setEditingUser({ ...editingUser, status: v as 'active' | 'inactive' })
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField
                label="Outlet Name"
                value={editingUser.outletName}
                onChange={(v) => setEditingUser({ ...editingUser, outletName: v })}
              />
              <InputField
                label="Department"
                value={editingUser.department}
                onChange={(v) => setEditingUser({ ...editingUser, department: v })}
              />
            </div>
            <ModalActions onCancel={() => setEditingUser(null)} />
          </form>
        </ModalFrame>
      )}
    </div>
  );
}

// --- Clean Reusable Form Primitives ---

function ModalFrame({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950/50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-700 block mb-1">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 2,
  required,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-700 block mb-1">{label}</span>
      <textarea
        rows={rows}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (val: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-700 block mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ModalActions({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 cursor-pointer"
      >
        Save Changes
      </button>
    </div>
  );
}
