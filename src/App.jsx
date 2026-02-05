import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Data from '@/pages/Data';
import Requests from '@/pages/Requests';
import RequestWorkspace from '@/pages/RequestWorkspace';
import Settings from '@/pages/Settings';
import Respond from '@/pages/Respond';
import Onboarding from '@/pages/Onboarding';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone pages (no nav) */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Main app with layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/data" element={<Data />} />
          <Route path="/respond" element={<Respond />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/requests/:id" element={<RequestWorkspace />} />
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
  );
}

export default App;
