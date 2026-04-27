import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useLicense } from '@/components/LicenseContext';
import { cn } from '@/lib/utils';
import { APP_VERSION, checkForUpdate } from '@/lib/versionCheck';
import buildInfo from '@/buildInfo.json';
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

const PASSPORT_SHA = typeof __PASSPORT_SHA__ === 'string' ? __PASSPORT_SHA__ : 'dev';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, paid: false },
  { name: 'Data', href: '/data', icon: Database, paid: false },
  { name: 'Policies', href: '/policies', icon: ClipboardCheck, paid: false },
  { name: 'Documents', href: '/documents', icon: FolderOpen, paid: false },
  { name: 'Report', href: '/report', icon: FileText, paid: true },
  { name: 'Respond', href: '/respond', icon: Upload, paid: false, preview: true },
  { name: 'Requests', href: '/requests', icon: Inbox, paid: true },
  { name: 'Settings', href: '/settings', icon: Settings, paid: false },
];

export default function Layout() {
  const location = useLocation();
  const { isPaid } = useLicense();
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
                Version {updateInfo.latest} is available.
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
                  Download
                </a>
              )}
              <button
                onClick={() => setUpdateDismissed(true)}
                className="text-indigo-200 hover:text-white"
                aria-label="Dismiss"
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
                <p className="text-xs text-slate-500">ESG response assistant</p>
              </div>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {navigation.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                const showLock = item.paid && !isPaid;
                const showPreview = item.preview && !isPaid;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                    {showPreview && (
                      <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                        Preview
                      </span>
                    )}
                    {showLock && <Lock aria-label={`${item.name} locked`} className="h-3 w-3 opacity-50" />}
                  </Link>
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
              {navigation.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                const showLock = item.paid && !isPaid;
                const showPreview = item.preview && !isPaid;
                return (
                  <Link
                    key={item.name}
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
                    {item.name}
                    {showPreview && (
                      <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                        Preview
                      </span>
                    )}
                    {showLock && (
                      <Lock aria-label={`${item.name} locked`} className="ml-auto h-3.5 w-3.5 opacity-50" />
                    )}
                  </Link>
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
            ESG Passport v{APP_VERSION} · VSME Compliant · Your data stays on your device
          </p>
          {buildInfo?.passportVersion && buildInfo.passportVersion !== 'dev' && (
            <p className="mt-1 text-right text-[10px] text-slate-400">
              v{buildInfo.passportVersion} · pass@{PASSPORT_SHA} · ext@{buildInfo.extractSha} · eng@{buildInfo.engineSha}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
