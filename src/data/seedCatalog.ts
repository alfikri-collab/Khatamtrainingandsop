import type {
  Announcement,
  FaqEntry,
  FormTemplate,
  QuickLink,
  RoleDefinition,
  SopCategory,
  SopDocument,
  TrainingCategory,
  TrainingModule,
} from '../types/hub';
import {
  calculateSopReadingMinutes,
  calculateTrainingReadingMinutes,
} from '../utils/formatters';

export const SEED_ROLES: Omit<RoleDefinition, 'id'>[] = [
  {
    code: 'ADMIN',
    label: 'System Administrator',
    description: 'Full access to manage all training content, SOPs, quick links, announcements, archives, and employee role permissions.',
    canManageContent: true,
    canManageUsers: true,
    sortOrder: 1,
  },
  {
    code: 'RETAIL_MANAGEMENT',
    label: 'Retail Management',
    description: 'Create, edit, publish, and version training modules, operational SOPs, FAQs, forms, and management announcements.',
    canManageContent: true,
    canManageUsers: false,
    sortOrder: 2,
  },
  {
    code: 'AREA_SUPERVISOR',
    label: 'Area Supervisor',
    description: 'View all approved retail operational references, leadership modules, KPI tools, and multi-outlet reporting resources.',
    canManageContent: false,
    canManageUsers: false,
    sortOrder: 3,
  },
  {
    code: 'OUTLET_MANAGER',
    label: 'Outlet Supervisor & Team Leader',
    description: 'View training modules, outlet SOPs, staff management forms, operational checklists, and quick links.',
    canManageContent: false,
    canManageUsers: false,
    sortOrder: 4,
  },
  {
    code: 'RETAIL_STAFF',
    label: 'Retail Staff',
    description: 'Access approved onboarding, customer service, sales training, outlet SOPs, FAQs, and daily operational quick links.',
    canManageContent: false,
    canManageUsers: false,
    sortOrder: 5,
  },
];

export interface SeedTrainingCategory {
  id: string;
  code: string;
  title: string;
  description: string;
  iconName: string;
  sortOrder: number;
  modules: string[];
}

export const SEED_TRAINING_CATEGORIES: SeedTrainingCategory[] = [
  {
    id: 'cat_trn_onboarding',
    code: 'A',
    title: 'New Employee Onboarding',
    description: 'Foundational knowledge, brand heritage, workplace conduct, and daily outlet expectations for new Khatam team members.',
    iconName: 'UserCheck',
    sortOrder: 1,
    modules: [
      'Introduction to Khatam',
      'Company Background and Brand Knowledge',
      'Retail Department Structure',
      'Job Responsibilities',
      'Employee Code of Conduct',
      'Attendance and Punctuality',
      'Grooming Standards',
      'Workplace Communication',
      'Outlet Working Guidelines',
    ],
  },
  {
    id: 'cat_trn_customer_service',
    code: 'B',
    title: 'Customer Service',
    description: 'Hospitality standards, consultative engagement, complaint resolution, and post-visit satisfaction excellence.',
    iconName: 'HeartHandshake',
    sortOrder: 2,
    modules: [
      'Customer Greeting Standards',
      'Customer Engagement',
      'Understanding Customer Needs',
      'Product Recommendation',
      'Handling Customer Complaints',
      'Difficult Customer Management',
      'Customer Satisfaction',
      'Google Review Management',
    ],
  },
  {
    id: 'cat_trn_sales',
    code: 'C',
    title: 'Sales Skills',
    description: 'Practical floor selling techniques, basket building, conversion optimisation, and repeat customer retention.',
    iconName: 'TrendingUp',
    sortOrder: 3,
    modules: [
      'Sales Techniques',
      'Upselling and Cross-Selling',
      'Product Knowledge',
      'Closing Techniques',
      'Increasing Average Basket Value',
      'Increasing Conversion Rate',
      'Customer Retention',
    ],
  },
  {
    id: 'cat_trn_operations',
    code: 'D',
    title: 'Retail Operations',
    description: 'End-to-end daily store execution covering opening, closing, cashiering, cash control, and stock routines.',
    iconName: 'Store',
    sortOrder: 4,
    modules: [
      'Daily Outlet Operations',
      'Opening Procedures',
      'Closing Procedures',
      'Cashier Operations',
      'Cash Handling',
      'Daily Sales Reporting',
      'Stock Receiving',
      'Stock Transfer',
      'Stock Replenishment',
      'Stock Count',
      'Inventory Management',
    ],
  },
  {
    id: 'cat_trn_vm',
    code: 'E',
    title: 'Visual Merchandising',
    description: 'Floor presentation, mannequin styling, garment care, folding precision, and store readiness audits.',
    iconName: 'Sparkles',
    sortOrder: 5,
    modules: [
      'VM Fundamentals',
      'Display Guidelines',
      'Product Arrangement',
      'Mannequin Styling',
      'Product Folding',
      'Ironing Standards',
      'Inbound Receiving and Display Preparation',
      'Store Presentation Standards',
      'VM Inspection Checklist',
    ],
  },
  {
    id: 'cat_trn_leadership',
    code: 'F',
    title: 'Leadership & Management',
    description: 'Outlet leadership, rostering, coaching, KPI stewardship, and area supervision practices.',
    iconName: 'Award',
    sortOrder: 6,
    modules: [
      'Outlet Management',
      'Staff Scheduling',
      'Staff Attendance Monitoring',
      'Team Communication',
      'Staff Coaching',
      'Performance Management',
      'Sales Monitoring',
      'Outlet KPI Management',
      'Area Supervisor Responsibilities',
    ],
  },
  {
    id: 'cat_trn_digital',
    code: 'G',
    title: 'Digital Tools & Technology',
    description: 'Hands-on training for Khatam POS, Xilnex, RFID, Marksold, Google Workspace sheets/forms, and AI productivity.',
    iconName: 'Laptop',
    sortOrder: 7,
    modules: [
      'POS System',
      'Xilnex System',
      'RFID Operations',
      'Marksold Counter',
      'Google Sheets',
      'Google Forms',
      'AI and Basic Prompt Writing',
      'Retail Dashboard Usage',
    ],
  },
];

export interface SeedSopCategory {
  id: string;
  code: string;
  title: string;
  description: string;
  iconName: string;
  sortOrder: number;
  sopPrefix: string;
  sops: string[];
}

export const SEED_SOP_CATEGORIES: SeedSopCategory[] = [
  {
    id: 'cat_sop_daily',
    code: 'A',
    title: 'Daily Outlet Management',
    description: 'Standard routines for outlet opening, closing, facility readiness, cleanliness, security, and daily reporting.',
    iconName: 'Building2',
    sortOrder: 1,
    sopPrefix: 'SOP-DOM',
    sops: [
      'Outlet Opening SOP',
      'Outlet Closing SOP',
      'Daily Checklist',
      'Outlet Cleanliness',
      'Outlet Security',
      'Air Conditioning and Lighting',
      'Equipment Maintenance',
      'Daily Reporting',
    ],
  },
  {
    id: 'cat_sop_sales',
    code: 'B',
    title: 'Sales & Cashier Management',
    description: 'Point-of-sale execution, cash float control, payment handling, exchanges, discounts, and end-of-day reconciliation.',
    iconName: 'CreditCard',
    sortOrder: 2,
    sopPrefix: 'SOP-SCM',
    sops: [
      'POS Sales Procedure',
      'Cashier Opening',
      'Cashier Closing',
      'Cash Handling',
      'Payment Methods',
      'Refund and Exchange',
      'Discount Procedures',
      'Sales Cancellation',
      'End-of-Day Sales Reconciliation',
    ],
  },
  {
    id: 'cat_sop_stock',
    code: 'C',
    title: 'Stock & Inventory Management',
    description: 'Receiving, inspection, transfers, adjustments, cycle counts, RFID/Marksold workflows, and discrepancy handling.',
    iconName: 'PackageCheck',
    sortOrder: 3,
    sopPrefix: 'SOP-SIM',
    sops: [
      'Stock Receiving',
      'Stock Inspection',
      'Stock Transfer',
      'Stock Adjustment',
      'Stock Replenishment',
      'Stock Count',
      'Damaged Items',
      'Missing Stock',
      'RFID Procedures',
      'Marksold Procedures',
    ],
  },
  {
    id: 'cat_sop_customer',
    code: 'D',
    title: 'Customer Service Management',
    description: 'Structured guidelines for greeting, enquiry handling, complaints, product exchanges, feedback, and Google reviews.',
    iconName: 'MessageSquareHeart',
    sortOrder: 4,
    sopPrefix: 'SOP-CSM',
    sops: [
      'Customer Greeting',
      'Customer Enquiries',
      'Customer Complaints',
      'Product Exchange',
      'Refund Handling',
      'Customer Feedback',
      'Google Review Management',
    ],
  },
  {
    id: 'cat_sop_hr',
    code: 'E',
    title: 'Staff & HR Management',
    description: 'Attendance, rostering, shift swaps, leave, overtime, grooming, workplace conduct, onboarding, and appraisals.',
    iconName: 'Users',
    sortOrder: 5,
    sopPrefix: 'SOP-HRM',
    sops: [
      'Attendance Management',
      'Staff Scheduling',
      'Shift Changes',
      'Leave Applications',
      'Overtime Procedures',
      'Grooming Standards',
      'Staff Discipline',
      'Workplace Conduct',
      'New Employee Onboarding',
      'Staff Performance Evaluation',
    ],
  },
  {
    id: 'cat_sop_vm',
    code: 'F',
    title: 'Visual Merchandising & Store Standards',
    description: 'Display setup, garment folding, steaming/ironing, mannequin styling, promotional zones, and store inspections.',
    iconName: 'LayoutGrid',
    sortOrder: 6,
    sopPrefix: 'SOP-VMS',
    sops: [
      'Store Opening Display Checklist',
      'Display Setup',
      'Product Arrangement',
      'Product Folding',
      'Ironing Standards',
      'Mannequin Standards',
      'Display Maintenance',
      'Promotional Display',
      'Store Inspection',
    ],
  },
  {
    id: 'cat_sop_admin',
    code: 'G',
    title: 'Outlet Administration & Reporting',
    description: 'Daily, weekly, and monthly outlet reports, incident logging, maintenance requests, and discrepancy reporting.',
    iconName: 'FileSpreadsheet',
    sortOrder: 7,
    sopPrefix: 'SOP-OAR',
    sops: [
      'Daily Sales Report',
      'Closing Report',
      'Weekly Outlet Report',
      'Monthly Performance Report',
      'Incident Report',
      'Maintenance Request',
      'Stock Discrepancy Report',
      'Customer Complaint Report',
    ],
  },
  {
    id: 'cat_sop_safety',
    code: 'H',
    title: 'Emergency & Safety Procedures',
    description: 'Fire safety, evacuation protocols, first aid, workplace accidents, theft incidents, and emergency contacts.',
    iconName: 'ShieldAlert',
    sortOrder: 8,
    sopPrefix: 'SOP-ESP',
    sops: [
      'Fire Safety',
      'Emergency Evacuation',
      'First Aid',
      'Workplace Accidents',
      'Theft and Security Incidents',
      'Emergency Contact Directory',
    ],
  },
];

export function buildSeedTrainingCategories(): Omit<TrainingCategory, 'updatedAt'>[] {
  return SEED_TRAINING_CATEGORIES.map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    description: c.description,
    iconName: c.iconName,
    sortOrder: c.sortOrder,
    isActive: true,
  }));
}

export function buildSeedTrainingModules(adminUid: string): Omit<TrainingModule, 'createdAt' | 'updatedAt'>[] {
  const result: Omit<TrainingModule, 'createdAt' | 'updatedAt'>[] = [];
  SEED_TRAINING_CATEGORIES.forEach((cat) => {
    cat.modules.forEach((title, idx) => {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      const modDraft = {
        id: `trn_${cat.code.toLowerCase()}_${idx + 1}_${slug.slice(0, 24)}`,
        categoryId: cat.id,
        title,
        description: `Core Khatam Retail training module covering ${title.toLowerCase()} standards and operational expectations.`,
        learningObjectives: [
          `Understand Khatam Retail expectations for ${title}`,
          'Apply standard workflow steps consistently across all outlets',
          'Identify escalation points and supporting operational forms',
        ],
        materialsSummary:
          'Editable training outline. Upload official Khatam Retail slide decks, PDF handouts, video links, and Google Drive folders via Admin Management.',
        pdfUrl: '',
        videoUrl: '',
        driveUrl: '',
        relatedSopCode: `${SEED_SOP_CATEGORIES[Math.min(cat.sortOrder - 1, 7)].sopPrefix}-001`,
        relatedFormTitle: `${title} Reference Checklist`,
        quizUrl: '',
        status: 'published' as const,
        updatedBy: adminUid,
      };
      result.push({
        ...modDraft,
        estimatedReadingMinutes: calculateTrainingReadingMinutes(modDraft),
      });
    });
  });
  return result;
}

export function buildSeedSopCategories(): Omit<SopCategory, 'updatedAt'>[] {
  return SEED_SOP_CATEGORIES.map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    description: c.description,
    iconName: c.iconName,
    sortOrder: c.sortOrder,
    isActive: true,
  }));
}

export function buildSeedSopDocuments(adminUid: string): Omit<SopDocument, 'createdAt' | 'updatedAt'>[] {
  const result: Omit<SopDocument, 'createdAt' | 'updatedAt'>[] = [];
  SEED_SOP_CATEGORIES.forEach((cat) => {
    cat.sops.forEach((title, idx) => {
      const num = String(idx + 1).padStart(3, '0');
      const sopCode = `${cat.sopPrefix}-${num}`;
      const sopDraft = {
        id: `sop_${cat.code.toLowerCase()}_${num}`,
        sopCode,
        title,
        categoryId: cat.id,
        purpose: `Editable placeholder template for ${title}. Retail Management will populate the approved operational purpose here.`,
        scope: 'All Khatam Retail outlets, outlet supervisors, team leaders, senior sales assistants, and floor staff (pending management approval).',
        personInCharge: 'Outlet Supervisor & Team Leader / Shift Supervisor',
        procedures: [
          `[Placeholder Step 1] Prepare required tools, forms, and system access before initiating ${title}.`,
          `[Placeholder Step 2] Execute the management-approved ${title} checklist and verify accuracy.`,
          `[Placeholder Step 3] Log completion in the designated outlet tracker and escalate exceptions to Area Supervisor.`,
        ],
        reminders: [
          'This document is an editable placeholder template until official approved SOP content is uploaded by Retail Management.',
          'Verify the SOP version number and effective date before applying changes on the floor.',
        ],
        relatedDocuments: `Refer to ${cat.title} forms and quick links for supporting sheets.`,
        pdfUrl: '',
        version: '0.1-template',
        relatedTrainingTitle: SEED_TRAINING_CATEGORIES[Math.min(cat.sortOrder - 1, 6)]?.modules[0] || 'Daily Outlet Operations',
        approvalStatus: 'Placeholder Template' as const,
        status: 'published' as const,
        updatedBy: adminUid,
      };
      result.push({
        ...sopDraft,
        estimatedReadingMinutes: calculateSopReadingMinutes(sopDraft),
      });
    });
  });
  return result;
}

export function buildSeedQuickLinks(adminUid: string): Omit<QuickLink, 'createdAt' | 'updatedAt'>[] {
  const items: Array<{
    title: string;
    category: QuickLink['category'];
    iconName: string;
    description: string;
    accessInstructions: string;
  }> = [
    // Sales & Reporting
    { title: 'POS System', category: 'Sales & Reporting', iconName: 'Monitor', description: 'Access outlet Point-of-Sale terminal portal and daily cashier tools.', accessInstructions: 'Use outlet cashier credentials. Placeholder URL — configure in Admin Management.' },
    { title: 'Xilnex', category: 'Sales & Reporting', iconName: 'Database', description: 'Launch Xilnex cloud POS & retail back-office portal.', accessInstructions: 'Sign in with assigned outlet Xilnex ID. Placeholder URL — configure in Admin.' },
    { title: 'Retail Sales Dashboard', category: 'Sales & Reporting', iconName: 'BarChart3', description: 'Real-time overview of daily and monthly retail outlet sales performance.', accessInstructions: 'Requires Khatam Google Workspace login.' },
    { title: 'Daily Sales Report', category: 'Sales & Reporting', iconName: 'FileSpreadsheet', description: 'Submit and review outlet daily sales summary figures.', accessInstructions: 'Submit before outlet closing cut-off time.' },
    { title: 'Outlet Performance Dashboard', category: 'Sales & Reporting', iconName: 'TrendingUp', description: 'Compare target vs actual KPIs across retail outlets.', accessInstructions: 'Accessible to Outlet Supervisors & Team Leaders, Area Supervisors, and Management.' },
    { title: 'Footfall Dashboard', category: 'Sales & Reporting', iconName: 'Footprints', description: 'Track daily visitor counts and peak-hour store traffic.', accessInstructions: 'Updated automatically via store counter integration.' },
    { title: 'Conversion Rate Tracking', category: 'Sales & Reporting', iconName: 'Percent', description: 'Monitor walk-in to transaction conversion ratios by outlet.', accessInstructions: 'Cross-reference with Footfall and Daily Sales figures.' },
    { title: 'Google Review Tracking', category: 'Sales & Reporting', iconName: 'Star', description: 'Log and monitor outlet Google Maps customer review scores and responses.', accessInstructions: 'Respond to all reviews within 24 hours per SOP.' },

    // Inventory & Stock
    { title: 'Stock Transfer Form', category: 'Inventory & Stock', iconName: 'ArrowLeftRight', description: 'Record inter-outlet or HQ-to-outlet stock transfers.', accessInstructions: 'Complete form prior to dispatching physical cartons.' },
    { title: 'Stock Adjustment Form', category: 'Inventory & Stock', iconName: 'SlidersHorizontal', description: 'Request inventory quantity adjustments for damaged or variance items.', accessInstructions: 'Requires Outlet Supervisor & Team Leader and Area Supervisor verification.' },
    { title: 'Stock Count Sheet', category: 'Inventory & Stock', iconName: 'ClipboardCheck', description: 'Cycle count and full stocktake recording sheet.', accessInstructions: 'Duplicate template tab per outlet stocktake date.' },
    { title: 'RFID System', category: 'Inventory & Stock', iconName: 'Radio', description: 'Open RFID tagging, scanning, and inventory audit portal.', accessInstructions: 'Ensure handheld RFID reader is paired before scanning.' },
    { title: 'Marksold System', category: 'Inventory & Stock', iconName: 'Tag', description: 'Access Marksold counter and garment tracking portal.', accessInstructions: 'Verify counter sync at start and end of each shift.' },
    { title: 'Stock Receiving Form', category: 'Inventory & Stock', iconName: 'PackagePlus', description: 'Log incoming warehouse deliveries and note packaging discrepancies.', accessInstructions: 'Submit within 24 hours of parcel arrival.' },
    { title: 'Inventory Monitoring Sheet', category: 'Inventory & Stock', iconName: 'Boxes', description: 'Live stock health, ageing SKUs, and replenishment alert tracker.', accessInstructions: 'Review weekly during outlet stock check.' },

    // HR & Staff Management
    { title: 'Staff Scheduling', category: 'HR & Staff Management', iconName: 'CalendarDays', description: 'Outlet weekly shift roster and coverage planning sheet.', accessInstructions: 'Publish next week roster by Thursday 6:00 PM.' },
    { title: 'Attendance Adjustment Form', category: 'HR & Staff Management', iconName: 'Clock', description: 'Submit clock-in/clock-out correction requests with reason.', accessInstructions: 'Requires Outlet Supervisor & Team Leader acknowledgement.' },
    { title: 'Leave Application', category: 'HR & Staff Management', iconName: 'CalendarCheck', description: 'Submit annual, medical, or emergency leave requests.', accessInstructions: 'Apply at least 7 days ahead for planned annual leave.' },
    { title: 'Shift Change Request', category: 'HR & Staff Management', iconName: 'RefreshCw', description: 'Request and log approved shift swaps between outlet staff.', accessInstructions: 'Both staff members and Outlet Supervisor & Team Leader must approve.' },
    { title: 'Overtime Form', category: 'HR & Staff Management', iconName: 'Timer', description: 'Record pre-approved retail overtime hours for payroll verification.', accessInstructions: 'Pre-approval from Area Supervisor is required.' },
    { title: 'Staff Evaluation Form', category: 'HR & Staff Management', iconName: 'UserCheck', description: 'Monthly and probation retail staff performance appraisal form.', accessInstructions: 'For Outlet Supervisors & Team Leaders and Area Supervisors.' },
    { title: 'New Joiner Information Form', category: 'HR & Staff Management', iconName: 'UserPlus', description: 'Collect onboarding details and system access setup for new hires.', accessInstructions: 'Complete on Day 1 of outlet onboarding.' },

    // Visual Merchandising
    { title: 'VM Tracker', category: 'Visual Merchandising', iconName: 'Eye', description: 'Track weekly VM execution scores and photo submissions across outlets.', accessInstructions: 'Upload outlet photos after every campaign changeover.' },
    { title: 'VM Guidelines', category: 'Visual Merchandising', iconName: 'BookOpen', description: 'Access Khatam visual merchandising handbook and seasonal lookbooks.', accessInstructions: 'Check latest version date before floor reset.' },
    { title: 'Display Reference', category: 'Visual Merchandising', iconName: 'Image', description: 'Approved table, rack, and window display reference gallery.', accessInstructions: 'Use as visual benchmark for opening readiness.' },
    { title: 'Product Catalogue', category: 'Visual Merchandising', iconName: 'Shirt', description: 'Complete SKU, colourway, size run, and fabric care catalogue.', accessInstructions: 'Useful for quick customer size and fabric enquiries.' },
    { title: 'Inbound Receiving Tracker', category: 'Visual Merchandising', iconName: 'Truck', description: 'Track new collection arrivals and display launch readiness.', accessInstructions: 'Coordinate steam & tag prep upon arrival.' },
    { title: 'Ironing Checklist', category: 'Visual Merchandising', iconName: 'Sparkles', description: 'Daily garment steaming and crease-free floor display checklist.', accessInstructions: 'Inspect mannequins and front tables every morning.' },
    { title: 'Display Readiness Checklist', category: 'Visual Merchandising', iconName: 'CheckSquare', description: 'Pre-opening visual merchandising & signage inspection form.', accessInstructions: 'Complete 15 minutes before store opening.' },

    // Operations & Administration
    { title: 'Outlet Opening Checklist', category: 'Operations & Administration', iconName: 'Sun', description: 'Daily pre-opening security, lighting, POS, and floor readiness form.', accessInstructions: 'Submit daily before store doors open.' },
    { title: 'Outlet Closing Checklist', category: 'Operations & Administration', iconName: 'Moon', description: 'End-of-day cash reconciliation, shutter lock, and safety verification.', accessInstructions: 'Complete after final customer exits.' },
    { title: 'Daily Closing Report', category: 'Operations & Administration', iconName: 'FileCheck2', description: 'Submit end-of-day sales, cash banking, and operational notes.', accessInstructions: 'Submit nightly before leaving the outlet.' },
    { title: 'Maintenance Request Form', category: 'Operations & Administration', iconName: 'Wrench', description: 'Report air-conditioning, lighting, fixture, or IT equipment faults.', accessInstructions: 'Attach photo and urgency level for faster dispatch.' },
    { title: 'Incident Report', category: 'Operations & Administration', iconName: 'AlertTriangle', description: 'Document workplace accidents, security events, or urgent customer incidents.', accessInstructions: 'Submit immediately and notify Area Supervisor.' },
    { title: 'Retail Communication Directory', category: 'Operations & Administration', iconName: 'PhoneCall', description: 'HQ Retail Operations, IT/POS support, VM, HR, and emergency contacts.', accessInstructions: 'Keep bookmarked on outlet iPad and POS terminal.' },

    // Learning & Development
    { title: 'Training Materials', category: 'Learning & Development', iconName: 'FolderOpen', description: 'Central Google Drive repository for Khatam Retail training decks and guides.', accessInstructions: 'Open with @khatam.com.my Google Workspace account.' },
    { title: 'Training Attendance', category: 'Learning & Development', iconName: 'ClipboardList', description: 'Log attendance for outlet briefings and HQ retail workshops.', accessInstructions: 'Submit after each completed training session.' },
    { title: 'Training Evaluation', category: 'Learning & Development', iconName: 'MessageSquare', description: 'Provide feedback on training clarity, relevance, and trainer delivery.', accessInstructions: 'Complete within 48 hours of session.' },
    { title: 'Training Assessment', category: 'Learning & Development', iconName: 'GraduationCap', description: 'Access module quizzes and onboarding competency assessments.', accessInstructions: 'Minimum passing benchmark configured by HR/Training.' },
    { title: 'Google Forms', category: 'Learning & Development', iconName: 'FileText', description: 'Directory of all active retail Google Forms.', accessInstructions: 'Bookmark frequently used daily forms.' },
    { title: 'Learning Videos', category: 'Learning & Development', iconName: 'PlayCircle', description: 'On-demand video walkthroughs for POS, folding, RFID, and greeting standards.', accessInstructions: 'Watch during quiet floor hours or onboarding.' },
  ];

  return items.map((item, idx) => ({
    id: `ql_${String(idx + 1).padStart(3, '0')}`,
    title: item.title,
    description: item.description,
    category: item.category,
    url: '',
    iconName: item.iconName,
    accessInstructions: item.accessInstructions,
    status: 'published',
    updatedBy: adminUid,
  }));
}

export function buildSeedForms(adminUid: string): Omit<FormTemplate, 'createdAt' | 'updatedAt'>[] {
  const forms: Omit<FormTemplate, 'createdAt' | 'updatedAt'>[] = [
    { id: 'frm_001', title: 'Daily Outlet Opening & Closing Checklist', description: 'Standard pre-opening and closing operational readiness verification form.', category: 'Daily Operations Forms', formatType: 'Google Form', url: '', status: 'published', updatedBy: adminUid },
    { id: 'frm_002', title: 'Outlet Cleanliness & Housekeeping Log', description: 'Shift-based housekeeping and fitting room inspection sheet.', category: 'Daily Operations Forms', formatType: 'PDF', url: '', status: 'published', updatedBy: adminUid },
    { id: 'frm_003', title: 'Inter-Outlet Stock Transfer Request', description: 'Log SKU quantities, source outlet, destination outlet, and courier tracking.', category: 'Stock & Inventory Forms', formatType: 'Google Form', url: '', status: 'published', updatedBy: adminUid },
    { id: 'frm_004', title: 'Cycle Count & Stock Discrepancy Sheet', description: 'Spreadsheet template for physical vs Xilnex inventory variance reporting.', category: 'Stock & Inventory Forms', formatType: 'Google Sheet', url: '', status: 'published', updatedBy: adminUid },
    { id: 'frm_005', title: 'Damaged & Defective Merchandise Log', description: 'Record damaged inbound or floor items awaiting adjustment approval.', category: 'Stock & Inventory Forms', formatType: 'Excel', url: '', status: 'published', updatedBy: adminUid },
    { id: 'frm_006', title: 'Staff Shift Change & Leave Request Form', description: 'Official HR submission for shift swaps, annual leave, and medical leave.', category: 'HR Forms', formatType: 'Google Form', url: '', status: 'published', updatedBy: adminUid },
    { id: 'frm_007', title: 'Attendance Adjustment & Overtime Log', description: 'Monthly attendance correction and pre-approved overtime verification template.', category: 'HR Forms', formatType: 'Google Sheet', url: '', status: 'published', updatedBy: adminUid },
    { id: 'frm_008', title: 'Retail Staff Performance Appraisal Template', description: 'Structured quarterly and probation evaluation rubric for outlet leaders.', category: 'HR Forms', formatType: 'Word', url: '', status: 'published', updatedBy: adminUid },
    { id: 'frm_009', title: 'Daily Sales & Cash Reconciliation Template', description: 'End-of-day tender breakdown (Cash, QR, Card, E-Wallet) vs POS Z-reading.', category: 'Sales Reporting Templates', formatType: 'Google Sheet', url: '', status: 'published', updatedBy: adminUid },
    { id: 'frm_010', title: 'Weekly & Monthly Outlet KPI Report', description: 'Consolidated outlet sales, ATV, UPT, footfall, and conversion template.', category: 'Sales Reporting Templates', formatType: 'Excel', url: '', status: 'published', updatedBy: adminUid },
    { id: 'frm_011', title: 'Store Display Readiness & VM Audit Checklist', description: 'Visual merchandising inspection checklist for mannequins, tables, and lighting.', category: 'VM Checklists', formatType: 'PDF', url: '', status: 'published', updatedBy: adminUid },
    { id: 'frm_012', title: 'Campaign Changeover & Steaming Checklist', description: 'Pre-launch preparation checklist for seasonal collections.', category: 'VM Checklists', formatType: 'Google Doc', url: '', status: 'published', updatedBy: adminUid },
    { id: 'frm_013', title: 'Outlet Incident & Security Report Form', description: 'Mandatory report for workplace injuries, theft, or urgent customer escalations.', category: 'Incident Reports', formatType: 'Google Form', url: '', status: 'published', updatedBy: adminUid },
    { id: 'frm_014', title: 'Equipment & Facility Maintenance Request', description: 'Log air-conditioning, POS hardware, RFID, or lighting repair requests.', category: 'Incident Reports', formatType: 'Google Form', url: '', status: 'published', updatedBy: adminUid },
    { id: 'frm_015', title: 'Training Attendance & Onboarding Sign-Off', description: 'Record completion of onboarding modules and in-store briefings.', category: 'Training Forms', formatType: 'Google Form', url: '', status: 'published', updatedBy: adminUid },
    { id: 'frm_016', title: 'Retail Coaching & Assessment Evaluation', description: 'Post-training feedback and practical floor assessment sheet.', category: 'Training Forms', formatType: 'Google Doc', url: '', status: 'published', updatedBy: adminUid },
  ];
  return forms;
}

export function buildSeedFaqs(adminUid: string): Omit<FaqEntry, 'createdAt' | 'updatedAt'>[] {
  return [
    {
      id: 'faq_001',
      question: 'What should I do if the POS system is down?',
      answer: 'Check outlet network connectivity first, notify your Outlet Supervisor & Team Leader and IT/POS Support immediately via the Retail Communication Directory, and follow the approved manual receipt fallback procedure until POS connectivity is restored.',
      category: 'Sales & Cashier',
      sopRef: 'SOP-SCM-001',
      quickLinkUrl: '',
      quickLinkLabel: 'Retail Communication Directory',
      status: 'published',
      updatedBy: adminUid,
    },
    {
      id: 'faq_002',
      question: 'How do I perform stock transfers?',
      answer: 'Verify SKU quantities physically, process the transfer entry in Xilnex/POS according to SOP-SIM-003, complete the Stock Transfer Form, and confirm dispatch/receipt sign-off with the receiving outlet.',
      category: 'Inventory & Stock',
      sopRef: 'SOP-SIM-003',
      quickLinkUrl: '',
      quickLinkLabel: 'Stock Transfer Form',
      status: 'published',
      updatedBy: adminUid,
    },
    {
      id: 'faq_003',
      question: 'How do I request a shift change?',
      answer: 'Coordinate coverage with a qualified team member, submit the Shift Change Request form in Quick Links, and obtain approval from your Outlet Supervisor & Team Leader before the shift begins.',
      category: 'HR & Scheduling',
      sopRef: 'SOP-HRM-003',
      quickLinkUrl: '',
      quickLinkLabel: 'Shift Change Request',
      status: 'published',
      updatedBy: adminUid,
    },
    {
      id: 'faq_004',
      question: 'What should I do if there is a stock discrepancy?',
      answer: 'Recount the affected SKU bin and check recent transfers or pending sales. Log the variance in the Stock Discrepancy Report and notify your Outlet Supervisor & Team Leader and Area Supervisor for stock adjustment verification.',
      category: 'Inventory & Stock',
      sopRef: 'SOP-OAR-007',
      quickLinkUrl: '',
      quickLinkLabel: 'Stock Adjustment Form',
      status: 'published',
      updatedBy: adminUid,
    },
    {
      id: 'faq_005',
      question: 'How do I submit the daily closing report?',
      answer: 'Complete POS Cashier Closing and reconcile all payment tenders against the Z-reading, then submit the Daily Closing Report and Outlet Closing Checklist before leaving the premises.',
      category: 'Daily Operations',
      sopRef: 'SOP-OAR-002',
      quickLinkUrl: '',
      quickLinkLabel: 'Daily Closing Report',
      status: 'published',
      updatedBy: adminUid,
    },
    {
      id: 'faq_006',
      question: 'What is the procedure for customer refunds?',
      answer: 'Inspect the receipt, purchase date, item condition, and tag integrity against Khatam exchange/refund eligibility rules. Escalate refund approvals to the Outlet Supervisor & Team Leader per SOP-SCM-006 and SOP-CSM-005.',
      category: 'Customer Service',
      sopRef: 'SOP-SCM-006',
      quickLinkUrl: '',
      quickLinkLabel: 'Refund & Exchange SOP',
      status: 'published',
      updatedBy: adminUid,
    },
    {
      id: 'faq_007',
      question: 'Who should I contact for RFID issues?',
      answer: 'First verify reader battery and Bluetooth/network pairing. If tags fail to scan or sync with Marksold/Xilnex, log a ticket via the Maintenance Request Form and contact IT/RFID Support listed in the Retail Communication Directory.',
      category: 'Digital Tools & RFID',
      sopRef: 'SOP-SIM-009',
      quickLinkUrl: '',
      quickLinkLabel: 'RFID System',
      status: 'published',
      updatedBy: adminUid,
    },
  ];
}

export function buildSeedAnnouncements(adminUid: string): Omit<Announcement, 'createdAt' | 'updatedAt'>[] {
  return [
    {
      id: 'ann_001',
      title: 'Welcome to Khatam Retail Learning & Operations Hub',
      description: 'All retail training modules, SOP templates, operational forms, FAQs, and system quick links are now centralised here. Management can upload approved documents and configure live links directly from Admin Management.',
      category: 'Operational',
      priority: 'High',
      relatedUrl: '',
      relatedLabel: 'Explore Quick Links',
      publishedDate: '2026-11-22',
      status: 'published',
      updatedBy: adminUid,
    },
    {
      id: 'ann_002',
      title: 'SOP Library Ready for Management Review & Approval',
      description: 'All 8 operational SOP categories have been structured with editable placeholder templates. Area Supervisors and Retail Management are invited to upload approved PDFs and step-by-step procedures.',
      category: 'New SOP',
      priority: 'Normal',
      relatedUrl: '',
      relatedLabel: 'Open SOP Library',
      publishedDate: '2026-11-20',
      status: 'published',
      updatedBy: adminUid,
    },
    {
      id: 'ann_003',
      title: 'Onboarding Curriculum & Digital Tools Modules Published',
      description: 'New Employee Onboarding, Customer Service, Visual Merchandising, and Digital Tools (POS, Xilnex, RFID, Marksold) training tracks are available for outlet briefings.',
      category: 'Training',
      priority: 'Normal',
      relatedUrl: '',
      relatedLabel: 'View Training Centre',
      publishedDate: '2026-11-18',
      status: 'published',
      updatedBy: adminUid,
    },
    {
      id: 'ann_004',
      title: 'Daily Closing & Stock Discrepancy Reporting Reminder',
      description: 'Outlet Supervisors & Team Leaders are reminded to submit Daily Closing Reports nightly and log any inbound or cycle count variances within 24 hours.',
      category: 'Revised Procedure',
      priority: 'High',
      relatedUrl: '',
      relatedLabel: 'Daily Closing Report',
      publishedDate: '2026-11-15',
      status: 'published',
      updatedBy: adminUid,
    },
  ];
}
