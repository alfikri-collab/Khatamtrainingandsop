import type { Timestamp } from 'firebase/firestore';
import type { RoleCode, SopDocument, TrainingModule } from '../types/hub';

const WORDS_PER_MINUTE = 180;
const MIN_READING_MINUTES = 1;
const MAX_READING_MINUTES = 240;

export function countWords(text?: string | null): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function calculateReadingMinutesFromTexts(texts: Array<string | undefined | null>): number {
  const totalWords = texts.reduce((sum, text) => sum + countWords(text), 0);
  const minutes = Math.ceil(totalWords / WORDS_PER_MINUTE);
  return Math.max(MIN_READING_MINUTES, Math.min(MAX_READING_MINUTES, minutes));
}

export function calculateTrainingReadingMinutes(
  mod: Pick<
    Partial<TrainingModule>,
    'title' | 'description' | 'learningObjectives' | 'materialsSummary' | 'relatedSopCode' | 'relatedFormTitle'
  >
): number {
  return calculateReadingMinutesFromTexts([
    mod.title,
    mod.description,
    ...(mod.learningObjectives || []),
    mod.materialsSummary,
    mod.relatedSopCode,
    mod.relatedFormTitle,
  ]);
}

export function calculateSopReadingMinutes(
  sop: Pick<
    Partial<SopDocument>,
    | 'sopCode'
    | 'title'
    | 'purpose'
    | 'scope'
    | 'personInCharge'
    | 'procedures'
    | 'reminders'
    | 'relatedDocuments'
    | 'relatedTrainingTitle'
  >
): number {
  return calculateReadingMinutesFromTexts([
    sop.sopCode,
    sop.title,
    sop.purpose,
    sop.scope,
    sop.personInCharge,
    ...(sop.procedures || []),
    ...(sop.reminders || []),
    sop.relatedDocuments,
    sop.relatedTrainingTitle,
  ]);
}

export function getTrainingReadingMinutes(mod: TrainingModule): number {
  if (
    typeof mod.estimatedReadingMinutes === 'number' &&
    Number.isFinite(mod.estimatedReadingMinutes) &&
    mod.estimatedReadingMinutes >= 1
  ) {
    return Math.round(mod.estimatedReadingMinutes);
  }
  return calculateTrainingReadingMinutes(mod);
}

export function getSopReadingMinutes(sop: SopDocument): number {
  if (
    typeof sop.estimatedReadingMinutes === 'number' &&
    Number.isFinite(sop.estimatedReadingMinutes) &&
    sop.estimatedReadingMinutes >= 1
  ) {
    return Math.round(sop.estimatedReadingMinutes);
  }
  return calculateSopReadingMinutes(sop);
}

export function formatReadingTime(minutes: number): string {
  const safeMinutes = Math.max(1, Math.round(minutes));
  return `${safeMinutes} min read`;
}

export function isSafeExternalUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function formatFirestoreDate(value: unknown): string {
  if (!value) return 'Just now';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const date = (value as Timestamp).toDate();
    return date.toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return 'Recently updated';
}

export function getRoleLabel(role: RoleCode): string {
  const labels: Record<RoleCode, string> = {
    ADMIN: 'System Admin',
    RETAIL_MANAGEMENT: 'Retail Management',
    AREA_SUPERVISOR: 'Area Supervisor',
    OUTLET_MANAGER: 'Outlet Supervisor & Team Leader',
    RETAIL_STAFF: 'Retail Staff',
  };
  return labels[role] || 'Retail Staff';
}

export function canManageContent(role?: RoleCode): boolean {
  return role === 'ADMIN' || role === 'RETAIL_MANAGEMENT';
}

export function canManageUsers(role?: RoleCode): boolean {
  return role === 'ADMIN';
}
