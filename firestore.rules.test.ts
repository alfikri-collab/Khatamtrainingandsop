/**
 * Security Rules Specification Verification Suite (Dirty Dozen Test Matrix)
 * Documents and validates the 12 adversarial payloads against firestore.rules.
 */

export interface SecurityTestCase {
  id: string;
  name: string;
  collection: string;
  operation: 'create' | 'update' | 'get' | 'list';
  actor: 'retail_staff' | 'outlet_manager' | 'unverified_admin' | 'management';
  payload: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
  enforcedByRule: string;
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 'DD-01',
    name: 'Self-Privilege Escalation on Create',
    collection: 'users/staff_uid_1',
    operation: 'create',
    actor: 'retail_staff',
    payload: {
      uid: 'staff_uid_1',
      displayName: 'Staff User',
      role: 'ADMIN',
      outletName: 'KLCC',
      department: 'Retail',
      status: 'active',
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'incoming().role == "RETAIL_STAFF" || isBootstrappedAdmin()',
  },
  {
    id: 'DD-02',
    name: 'Self-Privilege Escalation on Update',
    collection: 'users/staff_uid_1',
    operation: 'update',
    actor: 'retail_staff',
    payload: { role: 'RETAIL_MANAGEMENT' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'incoming().role == existing().role && affectedKeys().hasOnly(...)',
  },
  {
    id: 'DD-03',
    name: 'Shadow Field Injection on SOP Create',
    collection: 'sopDocuments/sop_shadow',
    operation: 'create',
    actor: 'management',
    payload: { sopCode: 'SOP-001', isOfficialBypass: true },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'data.keys().hasOnly([...]) inside isValidSopDocument()',
  },
  {
    id: 'DD-04',
    name: 'Unverified Email Spoofing',
    collection: 'users',
    operation: 'list',
    actor: 'unverified_admin',
    payload: { tokenEmail: 'alfikri@khatam.com.my', email_verified: false },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isVerifiedUser() requires request.auth.token.email_verified == true',
  },
  {
    id: 'DD-05',
    name: 'PII Cross-Read on Private User Info',
    collection: 'users/other_uid/private/info',
    operation: 'get',
    actor: 'retail_staff',
    payload: {},
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isOwner(userId) || isAdmin()',
  },
  {
    id: 'DD-06',
    name: 'Resource Exhaustion ID Poisoning',
    collection: 'sopDocuments/' + 'x'.repeat(300) + '$$$',
    operation: 'create',
    actor: 'management',
    payload: {},
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isValidId(sopId) checks size <= 128 and alphanumeric regex',
  },
  {
    id: 'DD-07',
    name: 'Timestamp Forgery on Create',
    collection: 'announcements/ann_forge',
    operation: 'create',
    actor: 'management',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'incoming().createdAt == request.time',
  },
  {
    id: 'DD-08',
    name: 'Immortal Field Tampering on Update',
    collection: 'trainingModules/mod_1',
    operation: 'update',
    actor: 'management',
    payload: { createdAt: 'REQUEST_TIME' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'incoming().createdAt == existing().createdAt',
  },
  {
    id: 'DD-09',
    name: 'Unauthorized Staff Content Write',
    collection: 'announcements/ann_unauth',
    operation: 'create',
    actor: 'outlet_manager',
    payload: { title: 'Fake Update', priority: 'High' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isManagement() required for announcements create',
  },
  {
    id: 'DD-10',
    name: 'Array Type Poisoning in SOP Procedures',
    collection: 'sopDocuments/sop_arr',
    operation: 'create',
    actor: 'management',
    payload: { procedures: [12345] },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isStringListBounded(data.procedures, 20) checks arr[0] is string',
  },
  {
    id: 'DD-11',
    name: 'Draft Scraping Query Without Published Filter',
    collection: 'sopDocuments',
    operation: 'list',
    actor: 'retail_staff',
    payload: { query: 'unfiltered' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'allow list: if isVerifiedUser() && (resource.data.status == "published" || isBootstrappedAdmin())',
  },
  {
    id: 'DD-12',
    name: 'Cross-User Progress Tampering',
    collection: 'users/other_uid/progress/mod_1',
    operation: 'create',
    actor: 'retail_staff',
    payload: { uid: 'other_uid', itemType: 'training', itemId: 'mod_1' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isOwner(userId) && data.uid == userId',
  },
];
