import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LicenseProvider, useLicense } from '@/components/LicenseContext';
import UpgradeGate from '@/components/UpgradeGate';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Data from '@/pages/Data';
import Requests from '@/pages/Requests';
import RequestWorkspace from '@/pages/RequestWorkspace';
import Settings from '@/pages/Settings';
import Respond from '@/pages/Respond';
import Onboarding from '@/pages/Onboarding';

/**
 * Route wrapper that shows an upgrade prompt for free users.
 * Paid users see the child component as normal.
 */
function PaidRoute({ feature, children }) {
  const { isPaid, isChecking } = useLicense();

  if (isChecking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isPaid) {
    return <UpgradeGate feature={feature} />;
  }

  return children;
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 rounded-none bg-red-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-500 mb-6">An unexpected error occurred. Your data is safe — try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-none font-medium hover:bg-indigo-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
    <LicenseProvider>
    <BrowserRouter>
      <Routes>
        {/* Standalone pages (no nav) */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Main app with layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/data" element={<Data />} />
          <Route path="/respond" element={<PaidRoute feature="Response Generator"><Respond /></PaidRoute>} />
          <Route path="/requests" element={<PaidRoute feature="Request Management"><Requests /></PaidRoute>} />
          <Route path="/requests/:id" element={<PaidRoute feature="Request Management"><RequestWorkspace /></PaidRoute>} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Redirects for old URLs */}
        <Route path="/upload" element={<Navigate to="/respond" replace />} />
        <Route path="/results" element={<Navigate to="/respond" replace />} />
        <Route path="/confidence" element={<Navigate to="/data" replace />} />
        <Route path="/policies" element={<Navigate to="/settings" replace />} />
        <Route path="/documents" element={<Navigate to="/settings" replace />} />
        <Route path="/answers" element={<Navigate to="/settings" replace />} />
        <Route path="/guide" element={<Navigate to="/settings" replace />} />
        <Route path="/export" element={<Navigate to="/respond" replace />} />
        <Route path="/tools/*" element={<Navigate to="/" replace />} />
        <Route path="/setup" element={<Navigate to="/onboarding" replace />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </LicenseProvider>
    </ErrorBoundary>
  );
}

export default App;
