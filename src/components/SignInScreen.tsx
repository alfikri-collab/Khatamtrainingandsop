import { useState } from 'react';
import { BookOpen, FileText, Link2, ShieldCheck, ArrowRight } from 'lucide-react';

interface SignInScreenProps {
  onSignIn: () => Promise<void>;
  error: string | null;
}

export function SignInScreen({ onSignIn, error }: SignInScreenProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onSignIn();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-between">
      <header className="w-full border-b border-zinc-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <span className="font-display font-bold text-base tracking-tight text-zinc-900 whitespace-nowrap shrink-0">
            Khatam Retail Hub
          </span>
          <span className="text-xs text-zinc-500 whitespace-nowrap hidden sm:inline">
            Internal Retail Operations &amp; Learning Portal
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-8 md:p-10 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-[#78561D] tracking-wide mb-3">
                Khatam Retail Department
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 text-balance mb-4">
                Khatam Retail Learning &amp; Operations Hub
              </h1>
              <p className="text-base text-zinc-600 leading-relaxed mb-8">
                One Platform. One Standard. Better Retail Operations. Access approved training modules, operational SOPs, daily checklists, forms, FAQs, and retail systems in one centralised workspace.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200/80">
                  <div className="flex items-center gap-2.5 text-zinc-900 font-medium text-sm mb-1">
                    <BookOpen className="w-4 h-4 text-[#9A732E]" />
                    Retail Training Centre
                  </div>
                  <p className="text-xs text-zinc-600">
                    Onboarding, customer service, sales skills, visual merchandising, and digital tools.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200/80">
                  <div className="flex items-center gap-2.5 text-zinc-900 font-medium text-sm mb-1">
                    <FileText className="w-4 h-4 text-[#9A732E]" />
                    Operational SOP Library
                  </div>
                  <p className="text-xs text-zinc-600">
                    Standardised outlet opening, cashiering, inventory, HR, and safety procedures.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200/80">
                  <div className="flex items-center gap-2.5 text-zinc-900 font-medium text-sm mb-1">
                    <Link2 className="w-4 h-4 text-[#9A732E]" />
                    Quick Links &amp; Systems
                  </div>
                  <p className="text-xs text-zinc-600">
                    Direct launchpad for POS, Xilnex, RFID, Marksold, dashboards, and HR forms.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200/80">
                  <div className="flex items-center gap-2.5 text-zinc-900 font-medium text-sm mb-1">
                    <ShieldCheck className="w-4 h-4 text-[#9A732E]" />
                    Role-Based Access
                  </div>
                  <p className="text-xs text-zinc-600">
                    Dedicated views for Retail Staff, Outlet Supervisors &amp; Team Leaders, Area Supervisors, and Admin.
                  </p>
                </div>
              </div>
            </div>

            <div>
              {error && (
                <div
                  role="alert"
                  className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleClick}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 text-sm font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-60 transition-colors cursor-pointer"
              >
                <span>{loading ? 'Signing in...' : 'Sign in with Google Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-zinc-500 mt-3">
                Sign in with your verified Google account to load your outlet role and hub resources.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col">
            <div className="relative flex-1 min-h-[260px] bg-zinc-100">
              <img
                src="/assets/aistudio/images_7ee0b728.jpg"
                alt="Khatam Retail flagship outlet counter and store interior"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-6 text-white">
                <p className="text-xs font-mono uppercase tracking-wider text-zinc-200 mb-1">
                  Khatam Retail Operations
                </p>
                <p className="text-base font-medium leading-snug">
                  Standardised knowledge and operational clarity across every Khatam outlet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <span>Khatam Retail Learning &amp; Operations Hub</span>
          <span>One Platform. One Standard. Better Retail Operations.</span>
        </div>
      </footer>
    </div>
  );
}
