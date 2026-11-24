export type RoleCode =
  | 'ADMIN'
  | 'RETAIL_MANAGEMENT'
  | 'AREA_SUPERVISOR'
  | 'OUTLET_MANAGER'
  | 'RETAIL_STAFF';

export type ContentStatus = 'published' | 'draft' | 'archived';

export type NavSection =
  | 'dashboard'
  | 'training'
  | 'sops'
  | 'quick-links'
  | 'forms'
  | 'faq'
  | 'announcements'
  | 'admin';

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string; // Loaded only for owner/admin from /users/{uid}/private/info
  role: RoleCode;
  outletName: string;
  department: string;
  status: 'active' | 'inactive';
  avatarUrl?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RoleDefinition {
  id: string;
  code: RoleCode;
  label: string;
  description: string;
  canManageContent: boolean;
  canManageUsers: boolean;
  sortOrder: number;
}

export interface TrainingCategory {
  id: string;
  code: string;
  title: string;
  description: string;
  iconName: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt?: unknown;
}

export interface TrainingModule {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  learningObjectives: string[];
  materialsSummary: string;
  pdfUrl: string;
  videoUrl: string;
  driveUrl: string;
  relatedSopCode: string;
  relatedFormTitle: string;
  quizUrl: string;
  estimatedReadingMinutes?: number;
  status: ContentStatus;
  updatedBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SopCategory {
  id: string;
  code: string;
  title: string;
  description: string;
  iconName: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt?: unknown;
}

export interface SopDocument {
  id: string;
  sopCode: string;
  title: string;
  categoryId: string;
  purpose: string;
  scope: string;
  personInCharge: string;
  procedures: string[];
  reminders: string[];
  relatedDocuments: string;
  pdfUrl: string;
  version: string;
  relatedTrainingTitle: string;
  approvalStatus: 'Placeholder Template' | 'Management Approved';
  estimatedReadingMinutes?: number;
  status: ContentStatus;
  updatedBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type QuickLinkCategory =
  | 'Sales & Reporting'
  | 'Inventory & Stock'
  | 'HR & Staff Management'
  | 'Visual Merchandising'
  | 'Operations & Administration'
  | 'Learning & Development';

export interface QuickLink {
  id: string;
  title: string;
  description: string;
  category: QuickLinkCategory;
  url: string;
  iconName: string;
  accessInstructions: string;
  status: ContentStatus;
  updatedBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type FormCategory =
  | 'Daily Operations Forms'
  | 'Stock & Inventory Forms'
  | 'HR Forms'
  | 'Sales Reporting Templates'
  | 'VM Checklists'
  | 'Incident Reports'
  | 'Training Forms';

export type FormFormatType =
  | 'Google Form'
  | 'Google Sheet'
  | 'Google Doc'
  | 'PDF'
  | 'Excel'
  | 'Word';

export interface FormTemplate {
  id: string;
  title: string;
  description: string;
  category: FormCategory;
  formatType: FormFormatType;
  url: string;
  status: ContentStatus;
  updatedBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  sopRef: string;
  quickLinkUrl: string;
  quickLinkLabel: string;
  status: ContentStatus;
  updatedBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type AnnouncementCategory =
  | 'Operational'
  | 'New SOP'
  | 'Revised Procedure'
  | 'Training'
  | 'System Maintenance'
  | 'Campaign';

export type AnnouncementPriority = 'High' | 'Normal' | 'Low';

export interface Announcement {
  id: string;
  title: string;
  description: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  relatedUrl: string;
  relatedLabel: string;
  publishedDate: string;
  status: ContentStatus;
  updatedBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface VersionHistoryEntry {
  id: string;
  entityType: 'sop' | 'training' | 'quickLink' | 'form' | 'faq' | 'announcement';
  entityId: string;
  entityTitle: string;
  version: string;
  changeSummary: string;
  changedBy: string;
  changedByName: string;
  createdAt?: unknown;
}

export interface UserProgress {
  id: string;
  uid: string;
  itemType: 'training' | 'sop';
  itemId: string;
  itemTitle: string;
  completedAt?: unknown;
}
