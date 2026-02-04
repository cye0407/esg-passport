import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Leaf,
  Home,
  Database,
  ShieldCheck,
  FileText,
  Inbox,
  Download,
  Settings,
  Menu,
  X,
  HelpCircle,
  Upload,
  BookOpen,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Data', href: '/data', icon: Database },
  { name: 'Confidence', href: '/confidence', icon: ShieldCheck },
  { name: 'Policies', href: '/policies', icon: FileText },
  { name: 'Requests', href: '/requests', icon: Inbox },
  { name: 'Respond', href: '/upload', icon: Upload },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Answers', href: '/answers', icon: BookOpen },
  { name: 'Export', href: '/export', icon: Download },
  { name: 'Guide', href: '/guide', icon: HelpCircle },
];

export default function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8faf5] to-[#e8f0e0]">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[#2D5016]/10 bg-white/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2D5016] to-[#7CB342] flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-[#2D5016]">ESG Passport</span>
                <p className="text-xs text-[#2D5016]/60">Your sustainability data, always ready</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-[#2D5016] text-white'
                        : 'text-[#2D5016]/70 hover:bg-[#2D5016]/10 hover:text-[#2D5016]'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
              <Link
                to="/settings"
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ml-2',
                  location.pathname === '/settings'
                    ? 'bg-[#2D5016] text-white'
                    : 'text-[#2D5016]/70 hover:bg-[#2D5016]/10 hover:text-[#2D5016]'
                )}
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-[#2D5016] hover:bg-[#2D5016]/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#2D5016]/10 bg-white/95 backdrop-blur-lg">
            <div className="px-4 py-3 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href ||
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-[#2D5016] text-white'
                        : 'text-[#2D5016]/70 hover:bg-[#2D5016]/10 hover:text-[#2D5016]'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  location.pathname === '/settings'
                    ? 'bg-[#2D5016] text-white'
                    : 'text-[#2D5016]/70 hover:bg-[#2D5016]/10 hover:text-[#2D5016]'
                )}
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2D5016]/10 bg-white/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-[#2D5016]/50">
            ESG Passport · VSME Compliant · Your data stays on your device
          </p>
        </div>
      </footer>
    </div>
  );
}
