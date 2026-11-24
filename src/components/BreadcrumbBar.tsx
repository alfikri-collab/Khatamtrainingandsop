import { ChevronRight, Home } from 'lucide-react';
import type { NavSection } from '../types/hub';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

interface BreadcrumbBarProps {
  items: BreadcrumbItem[];
  onNavigateDashboard: () => void;
  activeSection: NavSection;
}

export function BreadcrumbBar({
  items,
  onNavigateDashboard,
  activeSection,
}: BreadcrumbBarProps) {
  return (
    <div className="bg-zinc-50 border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1 overflow-x-auto">
          <ol className="flex items-center gap-1.5 text-xs text-zinc-500 whitespace-nowrap">
            <li className="flex items-center shrink-0">
              {activeSection === 'dashboard' && items.length <= 1 ? (
                <span
                  aria-current="page"
                  className="inline-flex items-center gap-1.5 font-medium text-zinc-900"
                >
                  <Home className="w-3.5 h-3.5 text-[#9A732E]" aria-hidden="true" />
                  <span>Hub</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onNavigateDashboard}
                  className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 rounded cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 text-[#9A732E]" aria-hidden="true" />
                  <span>Hub</span>
                </button>
              )}
            </li>

            {items.map((item, idx) => {
              const isLast = idx === items.length - 1 || item.isCurrent;
              return (
                <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5 min-w-0">
                  <ChevronRight
                    className="w-3.5 h-3.5 text-zinc-400 shrink-0"
                    aria-hidden="true"
                  />
                  {isLast || !item.onClick ? (
                    <span
                      aria-current={isLast ? 'page' : undefined}
                      title={item.label}
                      className="font-medium text-zinc-900 truncate max-w-[200px] sm:max-w-xs md:max-w-sm"
                    >
                      {item.label}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={item.onClick}
                      title={item.label}
                      className="text-zinc-600 hover:text-[#78561D] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 rounded truncate max-w-[180px] sm:max-w-xs cursor-pointer"
                    >
                      {item.label}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {items.length > 1 && items[items.length - 2]?.onClick && (
          <button
            type="button"
            onClick={items[items.length - 2].onClick}
            className="hidden sm:inline-flex items-center text-xs font-medium text-[#78561D] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            ← Back to {items[items.length - 2].label}
          </button>
        )}
      </div>
    </div>
  );
}
