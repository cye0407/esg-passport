import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useLicense } from '@/components/LicenseContext';
import { useT } from '@/components/LanguageContext';
import { cn } from '@/lib/utils';
import { APP_VERSION, checkForUpdate } from '@/lib/versionCheck';
import {
  ArrowUpCircle,
  ClipboardCheck,
  Database,
  FileText,
  FolderOpen,
  Home,
  Inbox,
  Lock,
  Menu,
  Settings,
  Shield,
  Upload,
  X,
} from 'lucide-react';

// `name` is a stable, language-independent identifier (used as a fallback and for
// logic); `labelKey` is the i18n key rendered to the user.
// Two groups, not eight equal tabs. The product has one job - a questionnaire arrives,
// you find out what it needs, you finish it - and six of the eight items are things you
// do in service of that job rather than the job itself. Nothing is removed; the
// secondary group simply stops competing for the first press.
const navigation = [
  { name: 'Home', labelKey: 'nav.home', href: '/', icon: Home, paid: false, primary: true },
  { name: 'Respond', labelKey: 'nav.respond', href: '/respond', icon: Upload, paid: false, primary: true },
  { name: 'Data', labelKey: 'nav.data', href: '/data', icon: Database, paid: false },
  { name: 'Policies', labelKey: 'nav.policies', href: '/policies', icon: ClipboardCheck, paid: false },
  { name: 'Documents', labelKey: 'nav.documents', href: '/documents', icon: FolderOpen, paid: false },
  { name: 'Report', labelKey: 'nav.report', href: '/report', icon: FileText, paid: true, capability: 'canGenerateReport' },
  { name: 'Requests', labelKey: 'nav.requests', href: '/requests', icon: Inbox, paid: false },
  { name: 'Settings', labelKey: 'nav.settings', href: '/settings', icon: Settings, paid: false },
];

export default function Layout() {
  const location = useLocation();
  const { isPaid, entitlements } = useLicense();
  // Lock on the capability the route itself enforces, not on "has paid something". A
  // Questionnaire Pass holder is paid but cannot generate a report, and showing that link
  // unlocked walked them into a EUR 499 paywall carrying an activation form their key
  // cannot satisfy.
  const hasAccess = (item) => !item.capability || entitlements?.[item.capability] === true;
  const visibleNav = navigation.filter(
    item => !(item.hideWhenPaid && isPaid) && !(item.hideWhenFree && !isPaid),
  );
  const t = useT();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [updateInfo, setUpdateInfo] = React.useState(null);
  const [updateDismissed, setUpdateDismissed] = React.useState(false);

  React.useEffect(() => {
    checkForUpdate().then((result) => {
      if (result.available) setUpdateInfo(result);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {updateInfo && !updateDismissed && (
        <div className="bg-indigo-600 text-white text-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 shrink-0" />
              <span>
                {t('layout.updateAvailable', { version: updateInfo.latest })}
                {updateInfo.notes && <span className="hidden sm:inline"> {updateInfo.notes}</span>}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {updateInfo.downloadUrl && (
                <a
                  href={updateInfo.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-2 hover:text-indigo-100"
                >
                  {t('layout.download')}
                </a>
              )}
              <button
                onClick={() => setUpdateDismissed(true)}
                className="text-indigo-200 hover:text-white"
                aria-label={t('layout.dismiss')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-none bg-slate-800">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-slate-800">ESG Passport</span>
                <p className="text-xs text-slate-500">{t('layout.tagline')}</p>
              </div>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {visibleNav.map((item, index) => {
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                const showLock = item.paid && !hasAccess(item);
                const label = t(item.labelKey);
                // A rule between the two items that carry the job and everything else.
                const startsSecondary = !item.primary && index > 0 && visibleNav[index - 1].primary;
                return (
                  <React.Fragment key={item.href}>
                    {startsSecondary && <span className="mx-2.5 h-6 w-px bg-slate-200" aria-hidden="true" />}
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center gap-2 rounded-lg transition-colors',
                        item.primary
                          ? 'px-3 py-2 text-sm font-medium'
                          : 'px-2.5 py-1.5 text-[13px]',
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : item.primary
                            ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
                      )}
                    >
                      {item.primary && <item.icon className="h-4 w-4" />}
                      {label}
                      {showLock && <Lock aria-label={t('nav.locked', { name: label })} className="h-3 w-3 opacity-50" />}
                    </Link>
                  </React.Fragment>
                );
              })}
            </div>

            <button
              className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white md:hidden">
            <div className="space-y-1 px-4 py-3">
              {visibleNav.map((item, index) => {
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                const showLock = item.paid && !hasAccess(item);
                const label = t(item.labelKey);
                const startsSecondary = !item.primary && index > 0 && visibleNav[index - 1].primary;
                return (
                  <React.Fragment key={item.href}>
                  {startsSecondary && <div className="my-2 h-px bg-slate-200" aria-hidden="true" />}
                  <Link
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-none px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {label}
                    {showLock && (
                      <Lock aria-label={t('nav.locked', { name: label })} className="ml-auto h-3.5 w-3.5 opacity-50" />
                    )}
                  </Link>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-400">
            {t('layout.footer', { version: APP_VERSION })}
          </p>
        </div>
      </footer>
    </div>
  );
}
