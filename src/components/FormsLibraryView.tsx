import { useMemo, useState } from 'react';
import { ExternalLink, FileSpreadsheet, Search } from 'lucide-react';
import type {
  FormCategory,
  FormFormatType,
  FormTemplate,
  NavSection,
  UserProfile,
} from '../types/hub';
import { canManageContent, formatFirestoreDate, isSafeExternalUrl } from '../utils/formatters';

interface FormsLibraryViewProps {
  userProfile: UserProfile;
  forms: FormTemplate[];
  highlightedId: string | null;
  onNavigate: (section: NavSection) => void;
}

const FORM_CATEGORIES: Array<'All' | FormCategory> = [
  'All',
  'Daily Operations Forms',
  'Stock & Inventory Forms',
  'HR Forms',
  'Sales Reporting Templates',
  'VM Checklists',
  'Incident Reports',
  'Training Forms',
];

const FORMAT_TYPES: Array<'All' | FormFormatType> = [
  'All',
  'Google Form',
  'Google Sheet',
  'Google Doc',
  'PDF',
  'Excel',
  'Word',
];

export function FormsLibraryView({
  userProfile,
  forms,
  highlightedId,
  onNavigate,
}: FormsLibraryViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | FormCategory>('All');
  const [selectedFormat, setSelectedFormat] = useState<'All' | FormFormatType>('All');
  const [searchText, setSearchText] = useState('');

  const isManager = canManageContent(userProfile.role);

  const visibleForms = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return forms
      .filter((f) => f.status === 'published')
      .filter((f) => (selectedCategory === 'All' ? true : f.category === selectedCategory))
      .filter((f) => (selectedFormat === 'All' ? true : f.formatType === selectedFormat))
      .filter((f) => {
        if (!q) return true;
        return (
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
        );
      });
  }, [forms, selectedCategory, selectedFormat, searchText]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Retail Forms &amp; Templates
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Centralised directory for operational forms, Google Sheets, checklists, and downloadable templates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search forms or templates..."
              className="pl-9 pr-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 w-64"
            />
          </div>
          {isManager && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="px-3.5 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Manage Forms
            </button>
          )}
        </div>
      </div>

      {/* Category & Format Filters */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {FORM_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100">
          <span className="text-xs font-medium text-zinc-500">Format:</span>
          {FORMAT_TYPES.map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setSelectedFormat(fmt)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                selectedFormat === fmt
                  ? 'bg-[#9A732E] text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {visibleForms.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
          <p className="text-sm font-medium text-zinc-900 mb-1">
            No forms or templates match your filters
          </p>
          <p className="text-xs text-zinc-500 mb-4">
            Reset your category or format filter to see all available templates.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSelectedFormat('All');
              setSearchText('');
            }}
            className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-xs text-zinc-500">
                  <th className="py-3 px-4 font-medium">Form / Template</th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium">Format</th>
                  <th className="py-3 px-4 font-medium">Updated</th>
                  <th className="py-3 px-4 font-medium text-right">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {visibleForms.map((form) => {
                  const hasUrl = isSafeExternalUrl(form.url);
                  const isHighlighted = highlightedId === form.id;
                  return (
                    <tr
                      key={form.id}
                      className={isHighlighted ? 'bg-amber-50/50' : 'hover:bg-zinc-50/70'}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <FileSpreadsheet className="w-4 h-4 text-[#9A732E] shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-zinc-900">{form.title}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{form.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-600 whitespace-nowrap">
                        {form.category}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-zinc-700 whitespace-nowrap">
                        {form.formatType}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-zinc-500 whitespace-nowrap">
                        {formatFirestoreDate(form.updatedAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {hasUrl ? (
                          <a
                            href={form.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900 hover:text-[#78561D]"
                          >
                            Open {form.formatType}
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-xs text-amber-700">
                            Link Pending Setup
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
