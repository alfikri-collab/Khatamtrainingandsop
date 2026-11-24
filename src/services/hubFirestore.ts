import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  OperationType,
  db,
  handleFirestoreError,
} from '../lib/firebase';
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
} from '../data/seedCatalog';
import type {
  Announcement,
  FaqEntry,
  FormTemplate,
  QuickLink,
  RoleCode,
  RoleDefinition,
  SopCategory,
  SopDocument,
  TrainingCategory,
  TrainingModule,
  UserProfile,
  UserProgress,
  VersionHistoryEntry,
} from '../types/hub';
import {
  calculateSopReadingMinutes,
  calculateTrainingReadingMinutes,
} from '../utils/formatters';

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned || `item_${Date.now()}`;
}

export async function ensureUserProfile(firebaseUser: User): Promise<UserProfile> {
  const uid = firebaseUser.uid;
  const userPath = `users/${uid}`;
  const privatePath = `users/${uid}/private/info`;
  const userRef = doc(db, 'users', uid);
  const privateRef = doc(db, 'users', uid, 'private', 'info');

  try {
    const snap = await getDoc(userRef);
    const isPrimaryAdmin =
      firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() &&
      firebaseUser.emailVerified;

    if (!snap.exists()) {
      const newProfile: UserProfile = {
        uid,
        displayName: (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Khatam Employee').slice(0, 120),
        role: isPrimaryAdmin ? 'ADMIN' : 'RETAIL_STAFF',
        outletName: isPrimaryAdmin ? 'HQ Retail Operations' : 'Khatam Retail Outlet',
        department: isPrimaryAdmin ? 'Retail Management' : 'Retail Operations',
        status: 'active',
        avatarUrl: (firebaseUser.photoURL || '').slice(0, 500),
      };

      await setDoc(userRef, {
        ...newProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (firebaseUser.email) {
        await setDoc(privateRef, {
          uid,
          email: firebaseUser.email.slice(0, 254),
          updatedAt: serverTimestamp(),
        });
      }

      return { ...newProfile, email: firebaseUser.email || undefined };
    }

    const existing = snap.data() as UserProfile;
    let email = firebaseUser.email || undefined;
    try {
      const privSnap = await getDoc(privateRef);
      if (privSnap.exists()) {
        email = (privSnap.data() as { email?: string }).email || email;
      } else if (firebaseUser.email) {
        await setDoc(privateRef, {
          uid,
          email: firebaseUser.email.slice(0, 254),
          updatedAt: serverTimestamp(),
        });
      }
    } catch {
      // Non-fatal fallback to auth email
    }

    return {
      ...existing,
      email,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath || privatePath);
  }
}

export async function updateOwnProfile(
  uid: string,
  updates: { displayName: string; outletName: string; department: string }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: updates.displayName.trim().slice(0, 120),
      outletName: updates.outletName.trim().slice(0, 120),
      department: updates.department.trim().slice(0, 120),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adminUpdateUser(
  uid: string,
  updates: { role: RoleCode; status: 'active' | 'inactive'; outletName: string; department: string; displayName: string }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: updates.displayName.trim().slice(0, 120),
      role: updates.role,
      status: updates.status,
      outletName: updates.outletName.trim().slice(0, 120),
      department: updates.department.trim().slice(0, 120),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

async function getExistingIds(collectionName: string): Promise<Set<string>> {
  const colRef = collection(db, collectionName);
  const q =
    collectionName === 'roles'
      ? query(colRef, where('sortOrder', '>=', 1))
      : colRef;
  const snap = await getDocs(q);
  return new Set(snap.docs.map((d) => d.id));
}

async function getExistingDocsMap(collectionName: string): Promise<Map<string, Record<string, unknown>>> {
  const colRef = collection(db, collectionName);
  const q =
    collectionName === 'roles'
      ? query(colRef, where('sortOrder', '>=', 1))
      : colRef;
  const snap = await getDocs(q);
  const map = new Map<string, Record<string, unknown>>();
  snap.docs.forEach((d) => {
    map.set(d.id, d.data() as Record<string, unknown>);
  });
  return map;
}

export async function seedHubCatalog(adminUid: string, adminName: string): Promise<void> {
  // Batch 1: Roles & Categories (must commit before Modules and SOPs due to exists() rules)
  try {
    const [
      existingRoles,
      existingTrnCats,
      existingSopCats,
      existingTrnMods,
      existingSops,
      existingLinks,
      existingForms,
      existingFaqs,
      existingAnns,
    ] = await Promise.all([
      getExistingIds('roles'),
      getExistingIds('trainingCategories'),
      getExistingIds('sopCategories'),
      getExistingDocsMap('trainingModules'),
      getExistingDocsMap('sopDocuments'),
      getExistingIds('quickLinks'),
      getExistingIds('formsTemplates'),
      getExistingIds('faqs'),
      getExistingIds('announcements'),
    ]);

    const batch1 = writeBatch(db);
    let batch1Count = 0;

    SEED_ROLES.forEach((role) => {
      const docId = sanitizeId(role.code);
      if (!existingRoles.has(docId)) {
        batch1.set(doc(db, 'roles', docId), role);
        batch1Count++;
      } else {
        batch1.update(doc(db, 'roles', docId), {
          label: role.label,
          description: role.description,
          canManageContent: role.canManageContent,
          canManageUsers: role.canManageUsers,
          sortOrder: role.sortOrder,
        });
        batch1Count++;
      }
    });

    buildSeedTrainingCategories().forEach(({ id, ...catData }) => {
      const docId = sanitizeId(id);
      if (!existingTrnCats.has(docId)) {
        batch1.set(doc(db, 'trainingCategories', docId), {
          ...catData,
          updatedAt: serverTimestamp(),
        });
        batch1Count++;
      }
    });

    buildSeedSopCategories().forEach(({ id, ...catData }) => {
      const docId = sanitizeId(id);
      if (!existingSopCats.has(docId)) {
        batch1.set(doc(db, 'sopCategories', docId), {
          ...catData,
          updatedAt: serverTimestamp(),
        });
        batch1Count++;
      }
    });

    if (batch1Count > 0) {
      await batch1.commit();
    }

    // Batch 2: Training Modules & SOP Documents
    const modules = buildSeedTrainingModules(adminUid);
    const sops = buildSeedSopDocuments(adminUid);
    const batch2 = writeBatch(db);
    let batch2Count = 0;

    modules.forEach(({ id, ...modData }) => {
      const docId = sanitizeId(id);
      if (!existingTrnMods.has(docId)) {
        batch2.set(doc(db, 'trainingModules', docId), {
          ...modData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        batch2Count++;
      }
    });

    existingTrnMods.forEach((existingData, docId) => {
      if (typeof existingData.estimatedReadingMinutes !== 'number') {
        const estimatedReadingMinutes = calculateTrainingReadingMinutes(
          existingData as Partial<TrainingModule>
        );
        batch2.update(doc(db, 'trainingModules', docId), {
          estimatedReadingMinutes,
          updatedBy: adminUid,
          updatedAt: serverTimestamp(),
        });
        batch2Count++;
      }
    });

    sops.forEach(({ id, ...sopData }) => {
      const docId = sanitizeId(id);
      if (!existingSops.has(docId)) {
        batch2.set(doc(db, 'sopDocuments', docId), {
          ...sopData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        batch2Count++;
      }
    });

    existingSops.forEach((existingData, docId) => {
      if (typeof existingData.estimatedReadingMinutes !== 'number') {
        const estimatedReadingMinutes = calculateSopReadingMinutes(
          existingData as Partial<SopDocument>
        );
        batch2.update(doc(db, 'sopDocuments', docId), {
          estimatedReadingMinutes,
          updatedBy: adminUid,
          updatedAt: serverTimestamp(),
        });
        batch2Count++;
      }
    });

    if (batch2Count > 0) {
      await batch2.commit();
    }

    // Batch 3: Quick Links, Forms, FAQs, Announcements, and initial Version History
    const batch3 = writeBatch(db);
    let batch3Count = 0;

    buildSeedQuickLinks(adminUid).forEach(({ id, ...linkData }) => {
      const docId = sanitizeId(id);
      if (!existingLinks.has(docId)) {
        batch3.set(doc(db, 'quickLinks', docId), {
          ...linkData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        batch3Count++;
      }
    });

    buildSeedForms(adminUid).forEach(({ id, ...formData }) => {
      const docId = sanitizeId(id);
      if (!existingForms.has(docId)) {
        batch3.set(doc(db, 'formsTemplates', docId), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        batch3Count++;
      }
    });

    buildSeedFaqs(adminUid).forEach(({ id, ...faqData }) => {
      const docId = sanitizeId(id);
      if (!existingFaqs.has(docId)) {
        batch3.set(doc(db, 'faqs', docId), {
          ...faqData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        batch3Count++;
      }
    });

    buildSeedAnnouncements(adminUid).forEach(({ id, ...annData }) => {
      const docId = sanitizeId(id);
      if (!existingAnns.has(docId)) {
        batch3.set(doc(db, 'announcements', docId), {
          ...annData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        batch3Count++;
      }
    });

    if (batch1Count + batch2Count + batch3Count > 0) {
      batch3.set(doc(db, 'versionHistory', sanitizeId(`hist_seed_${Date.now()}`)), {
        entityType: 'sop',
        entityId: 'sop_a_001',
        entityTitle: 'Khatam Retail Initial Hub Catalog',
        version: '1.0',
        changeSummary: `Synchronized ${modules.length} training modules, ${sops.length} SOP templates, quick links, forms, FAQs, and announcements.`,
        changedBy: adminUid,
        changedByName: adminName.slice(0, 120) || 'System Admin',
        createdAt: serverTimestamp(),
      });
      batch3Count++;
    }

    if (batch3Count > 0) {
      await batch3.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seedHubCatalog');
  }
}

export async function checkCatalogNeedsSeed(): Promise<boolean> {
  try {
    const [catSnap, sopSnap] = await Promise.all([
      getDocs(query(collection(db, 'trainingCategories'), where('isActive', '==', true))),
      getDocs(collection(db, 'sopDocuments')),
    ]);
    return catSnap.empty || sopSnap.empty;
  } catch {
    return false;
  }
}

export function subscribeCollection<T>(
  collectionName: string,
  options: {
    onlyPublished?: boolean;
    onlyActiveCategory?: boolean;
    userProgressUid?: string;
  },
  onData: (items: T[]) => void
): Unsubscribe {
  const path = options.userProgressUid
    ? `users/${options.userProgressUid}/progress`
    : collectionName;

  const colRef = options.userProgressUid
    ? collection(db, 'users', options.userProgressUid, 'progress')
    : collection(db, collectionName);

  const q = options.onlyPublished
    ? query(colRef, where('status', '==', 'published'))
    : options.onlyActiveCategory
      ? query(colRef, where('isActive', '==', true))
      : collectionName === 'roles'
        ? query(colRef, where('sortOrder', '>=', 1))
        : collectionName === 'versionHistory'
          ? query(
              colRef,
              where('entityType', 'in', [
                'sop',
                'training',
                'quickLink',
                'form',
                'faq',
                'announcement',
              ])
            )
          : colRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as T[];
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function logVersionHistory(entry: {
  entityType: VersionHistoryEntry['entityType'];
  entityId: string;
  entityTitle: string;
  version: string;
  changeSummary: string;
  changedBy: string;
  changedByName: string;
}): Promise<void> {
  const id = sanitizeId(`vh_${entry.entityType}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  try {
    await setDoc(doc(db, 'versionHistory', id), {
      entityType: entry.entityType,
      entityId: sanitizeId(entry.entityId),
      entityTitle: entry.entityTitle.slice(0, 200),
      version: entry.version.slice(0, 30),
      changeSummary: entry.changeSummary.slice(0, 500),
      changedBy: entry.changedBy,
      changedByName: entry.changedByName.slice(0, 120),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `versionHistory/${id}`);
  }
}

export async function saveTrainingCategory(
  data: Omit<TrainingCategory, 'updatedAt'>,
  isNew: boolean
): Promise<void> {
  const id = sanitizeId(data.id || `cat_trn_${Date.now()}`);
  try {
    await setDoc(doc(db, 'trainingCategories', id), {
      code: data.code.trim().slice(0, 10),
      title: data.title.trim().slice(0, 120),
      description: data.description.trim().slice(0, 400),
      iconName: data.iconName.trim().slice(0, 50) || 'BookOpen',
      sortOrder: Number(data.sortOrder) || 1,
      isActive: Boolean(data.isActive),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, `trainingCategories/${id}`);
  }
}

export async function saveSopCategory(
  data: Omit<SopCategory, 'updatedAt'>,
  isNew: boolean
): Promise<void> {
  const id = sanitizeId(data.id || `cat_sop_${Date.now()}`);
  try {
    await setDoc(doc(db, 'sopCategories', id), {
      code: data.code.trim().slice(0, 10),
      title: data.title.trim().slice(0, 120),
      description: data.description.trim().slice(0, 400),
      iconName: data.iconName.trim().slice(0, 50) || 'FileText',
      sortOrder: Number(data.sortOrder) || 1,
      isActive: Boolean(data.isActive),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, `sopCategories/${id}`);
  }
}

export async function saveTrainingModule(
  data: Omit<TrainingModule, 'createdAt' | 'updatedAt'>,
  actorUid: string,
  actorName: string,
  isNew: boolean
): Promise<void> {
  const id = sanitizeId(data.id || `trn_${Date.now()}`);
  const path = `trainingModules/${id}`;
  const cleanFields = {
    categoryId: sanitizeId(data.categoryId),
    title: data.title.trim().slice(0, 180),
    description: data.description.trim().slice(0, 800),
    learningObjectives: data.learningObjectives.map((s) => s.trim().slice(0, 240)).filter(Boolean).slice(0, 10),
    materialsSummary: data.materialsSummary.trim().slice(0, 2000),
    pdfUrl: data.pdfUrl.trim().slice(0, 500),
    videoUrl: data.videoUrl.trim().slice(0, 500),
    driveUrl: data.driveUrl.trim().slice(0, 500),
    relatedSopCode: data.relatedSopCode.trim().slice(0, 60),
    relatedFormTitle: data.relatedFormTitle.trim().slice(0, 180),
    quizUrl: data.quizUrl.trim().slice(0, 500),
  };
  const payload = {
    ...cleanFields,
    estimatedReadingMinutes: calculateTrainingReadingMinutes(cleanFields),
    status: data.status,
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
  };

  try {
    if (isNew) {
      await setDoc(doc(db, 'trainingModules', id), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'trainingModules', id), payload);
    }
    await logVersionHistory({
      entityType: 'training',
      entityId: id,
      entityTitle: payload.title,
      version: isNew ? '1.0' : 'Updated',
      changeSummary: isNew ? 'Created new training module' : `Updated module (${payload.status})`,
      changedBy: actorUid,
      changedByName: actorName,
    });
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function saveSopDocument(
  data: Omit<SopDocument, 'createdAt' | 'updatedAt'>,
  actorUid: string,
  actorName: string,
  isNew: boolean,
  changeSummary?: string
): Promise<void> {
  const id = sanitizeId(data.id || `sop_${Date.now()}`);
  const path = `sopDocuments/${id}`;
  const cleanFields = {
    sopCode: data.sopCode.trim().slice(0, 40),
    title: data.title.trim().slice(0, 180),
    categoryId: sanitizeId(data.categoryId),
    purpose: data.purpose.trim().slice(0, 1000),
    scope: data.scope.trim().slice(0, 500),
    personInCharge: data.personInCharge.trim().slice(0, 200),
    procedures: data.procedures.map((s) => s.trim().slice(0, 350)).filter(Boolean).slice(0, 20),
    reminders: data.reminders.map((s) => s.trim().slice(0, 300)).filter(Boolean).slice(0, 10),
    relatedDocuments: data.relatedDocuments.trim().slice(0, 500),
    pdfUrl: data.pdfUrl.trim().slice(0, 500),
    version: data.version.trim().slice(0, 20) || '1.0',
    relatedTrainingTitle: data.relatedTrainingTitle.trim().slice(0, 180),
    approvalStatus: data.approvalStatus,
  };
  const payload = {
    ...cleanFields,
    estimatedReadingMinutes: calculateSopReadingMinutes(cleanFields),
    status: data.status,
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
  };

  try {
    if (isNew) {
      await setDoc(doc(db, 'sopDocuments', id), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'sopDocuments', id), payload);
    }
    await logVersionHistory({
      entityType: 'sop',
      entityId: id,
      entityTitle: `${payload.sopCode} — ${payload.title}`,
      version: payload.version,
      changeSummary: changeSummary?.trim().slice(0, 500) || (isNew ? 'Created SOP record' : `Updated SOP (${payload.approvalStatus}, ${payload.status})`),
      changedBy: actorUid,
      changedByName: actorName,
    });
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function saveQuickLink(
  data: Omit<QuickLink, 'createdAt' | 'updatedAt'>,
  actorUid: string,
  actorName: string,
  isNew: boolean
): Promise<void> {
  const id = sanitizeId(data.id || `ql_${Date.now()}`);
  const path = `quickLinks/${id}`;
  const payload = {
    title: data.title.trim().slice(0, 120),
    description: data.description.trim().slice(0, 400),
    category: data.category,
    url: data.url.trim().slice(0, 500),
    iconName: data.iconName.trim().slice(0, 50) || 'ExternalLink',
    accessInstructions: data.accessInstructions.trim().slice(0, 400),
    status: data.status,
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
  };

  try {
    if (isNew) {
      await setDoc(doc(db, 'quickLinks', id), { ...payload, createdAt: serverTimestamp() });
    } else {
      await updateDoc(doc(db, 'quickLinks', id), payload);
    }
    await logVersionHistory({
      entityType: 'quickLink',
      entityId: id,
      entityTitle: payload.title,
      version: isNew ? '1.0' : 'Updated',
      changeSummary: isNew ? 'Added quick link' : 'Updated quick link URL/details',
      changedBy: actorUid,
      changedByName: actorName,
    });
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function saveFormTemplate(
  data: Omit<FormTemplate, 'createdAt' | 'updatedAt'>,
  actorUid: string,
  actorName: string,
  isNew: boolean
): Promise<void> {
  const id = sanitizeId(data.id || `frm_${Date.now()}`);
  const path = `formsTemplates/${id}`;
  const payload = {
    title: data.title.trim().slice(0, 140),
    description: data.description.trim().slice(0, 400),
    category: data.category,
    formatType: data.formatType,
    url: data.url.trim().slice(0, 500),
    status: data.status,
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
  };

  try {
    if (isNew) {
      await setDoc(doc(db, 'formsTemplates', id), { ...payload, createdAt: serverTimestamp() });
    } else {
      await updateDoc(doc(db, 'formsTemplates', id), payload);
    }
    await logVersionHistory({
      entityType: 'form',
      entityId: id,
      entityTitle: payload.title,
      version: isNew ? '1.0' : 'Updated',
      changeSummary: isNew ? 'Added form template' : 'Updated form template link/details',
      changedBy: actorUid,
      changedByName: actorName,
    });
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function saveFaq(
  data: Omit<FaqEntry, 'createdAt' | 'updatedAt'>,
  actorUid: string,
  actorName: string,
  isNew: boolean
): Promise<void> {
  const id = sanitizeId(data.id || `faq_${Date.now()}`);
  const path = `faqs/${id}`;
  const payload = {
    question: data.question.trim().slice(0, 300),
    answer: data.answer.trim().slice(0, 1500),
    category: data.category.trim().slice(0, 80),
    sopRef: data.sopRef.trim().slice(0, 60),
    quickLinkUrl: data.quickLinkUrl.trim().slice(0, 500),
    quickLinkLabel: data.quickLinkLabel.trim().slice(0, 120),
    status: data.status,
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
  };

  try {
    if (isNew) {
      await setDoc(doc(db, 'faqs', id), { ...payload, createdAt: serverTimestamp() });
    } else {
      await updateDoc(doc(db, 'faqs', id), payload);
    }
    await logVersionHistory({
      entityType: 'faq',
      entityId: id,
      entityTitle: payload.question,
      version: isNew ? '1.0' : 'Updated',
      changeSummary: isNew ? 'Published FAQ entry' : 'Updated FAQ entry',
      changedBy: actorUid,
      changedByName: actorName,
    });
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function saveAnnouncement(
  data: Omit<Announcement, 'createdAt' | 'updatedAt'>,
  actorUid: string,
  actorName: string,
  isNew: boolean
): Promise<void> {
  const id = sanitizeId(data.id || `ann_${Date.now()}`);
  const path = `announcements/${id}`;
  const payload = {
    title: data.title.trim().slice(0, 180),
    description: data.description.trim().slice(0, 1500),
    category: data.category,
    priority: data.priority,
    relatedUrl: data.relatedUrl.trim().slice(0, 500),
    relatedLabel: data.relatedLabel.trim().slice(0, 120),
    publishedDate: data.publishedDate.trim().slice(0, 30),
    status: data.status,
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
  };

  try {
    if (isNew) {
      await setDoc(doc(db, 'announcements', id), { ...payload, createdAt: serverTimestamp() });
    } else {
      await updateDoc(doc(db, 'announcements', id), payload);
    }
    await logVersionHistory({
      entityType: 'announcement',
      entityId: id,
      entityTitle: payload.title,
      version: isNew ? '1.0' : 'Updated',
      changeSummary: isNew ? 'Published announcement' : 'Updated announcement',
      changedBy: actorUid,
      changedByName: actorName,
    });
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function setDocumentStatus(
  collectionName: 'trainingModules' | 'sopDocuments' | 'quickLinks' | 'formsTemplates' | 'faqs' | 'announcements',
  id: string,
  status: 'published' | 'draft' | 'archived',
  actorUid: string
): Promise<void> {
  const path = `${collectionName}/${id}`;
  try {
    await updateDoc(doc(db, collectionName, id), {
      status,
      updatedBy: actorUid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeDocument(collectionName: string, id: string): Promise<void> {
  const path = `${collectionName}/${id}`;
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function toggleUserProgressItem(
  uid: string,
  itemType: 'training' | 'sop',
  itemId: string,
  itemTitle: string,
  currentlyCompleted: boolean
): Promise<void> {
  const progressId = sanitizeId(`${itemType}_${itemId}`);
  const path = `users/${uid}/progress/${progressId}`;
  try {
    const ref = doc(db, 'users', uid, 'progress', progressId);
    if (currentlyCompleted) {
      await deleteDoc(ref);
    } else {
      const payload: Omit<UserProgress, 'id' | 'completedAt'> & { completedAt: ReturnType<typeof serverTimestamp> } = {
        uid,
        itemType,
        itemId: sanitizeId(itemId),
        itemTitle: itemTitle.slice(0, 200),
        completedAt: serverTimestamp(),
      };
      await setDoc(ref, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
