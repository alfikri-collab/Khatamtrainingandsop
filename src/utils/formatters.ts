import type { Timestamp } from 'firebase/firestore';
import type { RoleCode } from '../types/hub';

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
    OUTLET_MANAGER: 'Outlet Manager',
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
