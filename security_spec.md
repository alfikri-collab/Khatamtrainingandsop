# Firestore Security Specification — Khatam Retail Learning & Operations Hub

## 1. Data Invariants
1. **Identity & Privilege Separation**: Users can create their own initial profile (`/users/{userId}`) ONLY with role `RETAIL_STAFF` unless their verified Google token email matches the bootstrapped administrator (`alfikri@khatam.com.my`). Only an `ADMIN` can change user roles or account status.
2. **PII Isolation**: Employee email addresses live exclusively in `/users/{userId}/private/info`, readable and writable only by the owner or an `ADMIN`.
3. **Immutable Audit Fields**: `createdAt` and `uid` / `changedBy` cannot be altered after creation. All `createdAt`, `updatedAt`, and `completedAt` fields must equal `request.time`.
4. **Content Management Authority**: Only `ADMIN` and `RETAIL_MANAGEMENT` can create, update, archive, or delete training categories, training modules, SOP categories, SOP documents, quick links, forms, FAQs, announcements, and version history entries.
5. **Published Visibility Enforcement**: List queries on knowledge collections evaluate `resource.data.status == 'published'` (or bootstrapped admin override) so unapproved drafts and archived records are never exposed to standard staff queries.
6. **Strict Schema & Bounds**: All strings enforce `.size()` bounds, all arrays enforce `.size() <= MAX` and first-element type validation, all document IDs match `^[a-zA-Z0-9_\-]+$`, and `keys().hasAll(...)` + `keys().hasOnly(...)` reject shadow fields.

## 2. The "Dirty Dozen" Attack Payloads
1. **Self-Privilege Escalation on Create**: Retail staff registers `/users/{uid}` with `role: "ADMIN"`. -> Expected: `PERMISSION_DENIED`.
2. **Self-Privilege Escalation on Update**: Retail staff updates own `/users/{uid}` changing `role` to `"RETAIL_MANAGEMENT"`. -> Expected: `PERMISSION_DENIED`.
3. **Shadow Field Injection**: Management creates a `sopDocuments` doc containing extra field `isOfficialBypass: true`. -> Expected: `PERMISSION_DENIED`.
4. **Email Spoofing**: Unverified token (`email_verified: false`) claims admin email to read `/users`. -> Expected: `PERMISSION_DENIED`.
5. **PII Cross-Read**: Retail staff reads `/users/{otherUid}/private/info`. -> Expected: `PERMISSION_DENIED`.
6. **Resource Exhaustion ID Poisoning**: Creating `/sopDocuments/{1500_char_id}` with invalid characters. -> Expected: `PERMISSION_DENIED`.
7. **Timestamp Forgery**: Client submits `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time`. -> Expected: `PERMISSION_DENIED`.
8. **Immortal Field Tampering**: Updating a `trainingModules` doc while changing `createdAt`. -> Expected: `PERMISSION_DENIED`.
9. **Unauthorized Staff Content Write**: `OUTLET_MANAGER` attempts to publish an `announcements` doc. -> Expected: `PERMISSION_DENIED`.
10. **Array Type Poisoning**: Submitting `procedures: [12345]` instead of strings in `sopDocuments`. -> Expected: `PERMISSION_DENIED`.
11. **Draft Scraping Query**: Standard staff queries `/sopDocuments` without `where('status', '==', 'published')`. -> Expected: `PERMISSION_DENIED`.
12. **Cross-User Progress Tampering**: User A writes to `/users/{userB}/progress/{id}`. -> Expected: `PERMISSION_DENIED`.

## 3. Verification Runner
See `/firestore.rules.test.ts` for the structured test suite covering all 12 attack vectors.
