import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Setup from '@/pages/Setup';
import Data from '@/pages/Data';
import Confidence from '@/pages/Confidence';
import Policies from '@/pages/Policies';
import Requests from '@/pages/Requests';
import RequestWorkspace from '@/pages/RequestWorkspace';
import Export from '@/pages/Export';
import Settings from '@/pages/Settings';
import Guide from '@/pages/Guide';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Setup is standalone (no nav) */}
        <Route path="/setup" element={<Setup />} />
        
        {/* Main app with layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/data" element={<Data />} />
          <Route path="/confidence" element={<Confidence />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/requests/:id" element={<RequestWorkspace />} />
          <Route path="/export" element={<Export />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
