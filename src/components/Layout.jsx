import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useLicense } from '@/components/LicenseContext';
import { cn } from '@/lib/utils';
import { checkForUpdate, APP_VERSION } from '@/lib/versionCheck';
import {
  Shield,
  Home,
  Database,
  Upload,
  Inbox,
  Settings,
  Menu,
  X,
  Lock,
  ClipboardCheck,
  FolderOpen,
  FileText,
  ArrowUpCircle,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, paid: false },
  { name: 'Data', href: '/data', icon: Database, paid: false },
  { name: 'Policies', href: '/policies', icon: ClipboardCheck, paid: false },
  { name: 'Documents', href: '/documents', icon: FolderOpen, paid: false },
  { name: 'Report', href: '/report', icon: FileText, paid: false },
  { name: 'Respond', href: '/respond', icon: Upload, paid: true },
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
      {/* Update Banner */}
      {updateInfo && !updateDismissed && (
        <div className="bg-indigo-600 text-white text-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 shrink-0" />
              <span>
                Version {updateInfo.latest} is available.
                {updateInfo.notes && <span className="hidden sm:inline"> {updateInfo.notes}</span>}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
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
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-slate-800 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-slate-800">ESG Passport</span>
                <p className="text-xs text-slate-500">ESG response assistant</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href ||
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                const showLock = item.paid && !isPaid;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                    {showLock && <Lock className="w-3 h-3 opacity-50" />}
                  </Link>
                );
              })}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href ||
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                const showLock = item.paid && !isPaid;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-none text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                    {showLock && <Lock className="w-3.5 h-3.5 opacity-50 ml-auto" />}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-slate-400">
            ESG Passport v{APP_VERSION} · VSME Compliant · Your data stays on your device
          </p>
        </div>
      </footer>
    </div>
  );
}
