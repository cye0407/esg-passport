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
import Upload from '@/pages/Upload';
import Results from '@/pages/Results';
import Documents from '@/pages/Documents';
import AnswerLibrary from '@/pages/AnswerLibrary';
import Onboarding from '@/pages/Onboarding';

// Free tools (standalone, no auth)
import ToolsIndex from '@/pages/tools/index';
import CarbonCalculator from '@/pages/tools/CarbonCalculator';
import EcoVadisReadiness from '@/pages/tools/EcoVadisReadiness';
import Scope2Calculator from '@/pages/tools/Scope2Calculator';
import WaterCalculator from '@/pages/tools/WaterCalculator';
import WasteCalculator from '@/pages/tools/WasteCalculator';
import TimeEstimator from '@/pages/tools/TimeEstimator';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone pages (no nav) */}
        <Route path="/setup" element={<Setup />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Free tools (standalone, SEO-friendly) */}
        <Route path="/tools" element={<ToolsIndex />} />
        <Route path="/tools/carbon-calculator" element={<CarbonCalculator />} />
        <Route path="/tools/ecovadis-readiness" element={<EcoVadisReadiness />} />
        <Route path="/tools/scope2-calculator" element={<Scope2Calculator />} />
        <Route path="/tools/water-calculator" element={<WaterCalculator />} />
        <Route path="/tools/waste-calculator" element={<WasteCalculator />} />
        <Route path="/tools/time-estimator" element={<TimeEstimator />} />
        
        {/* Main app with layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/data" element={<Data />} />
          <Route path="/confidence" element={<Confidence />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/requests/:id" element={<RequestWorkspace />} />
          <Route path="/export" element={<Export />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/results" element={<Results />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/answers" element={<AnswerLibrary />} />
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
