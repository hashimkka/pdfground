import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './screens/Landing';
import { Welcome } from './screens/Welcome';
import { HowItWorks } from './screens/HowItWorks';
import { ChoosePlan } from './screens/ChoosePlan';
import { ProAccess } from './screens/ProAccess';
import { Dashboard } from './screens/Dashboard';
import { MergePDF } from './screens/MergePDF';
import { SplitPDF } from './screens/SplitPDF';
import { CompressPDF } from './screens/CompressPDF';
import { ConvertPDF } from './screens/ConvertPDF';
import { OCRTool } from './screens/OCRTool';
import { History } from './screens/History';
import { ReorderPDF } from './screens/ReorderPDF';
import { DeletePages } from './screens/DeletePages';
import { ExtractPages } from './screens/ExtractPages';
import { ExportPDF } from './screens/ExportPDF';
import { PasswordProtect } from './screens/PasswordProtect';
import { BatchProcess } from './screens/BatchProcess';

import { useEffect, useState } from 'react';

function App() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has completed onboarding
    const onboardingComplete = localStorage.getItem('onboarding_complete');
    setHasCompletedOnboarding(onboardingComplete === 'true');
  }, []);

  // Show loading state while checking onboarding status
  if (hasCompletedOnboarding === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Landing page - default route */}
        <Route path="/" element={<Landing />} />

        {/* Onboarding flow */}
        <Route
          path="/onboarding"
          element={hasCompletedOnboarding ? <Navigate to="/dashboard" replace /> : <Welcome />}
        />
        <Route
          path="/onboarding/how-it-works"
          element={hasCompletedOnboarding ? <Navigate to="/dashboard" replace /> : <HowItWorks />}
        />
        <Route
          path="/onboarding/choose-plan"
          element={hasCompletedOnboarding ? <Navigate to="/dashboard" replace /> : <ChoosePlan />}
        />

        {/* Main app routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pro-access" element={<ProAccess />} />
        <Route path="/merge" element={<MergePDF />} />
        <Route path="/split" element={<SplitPDF />} />
        <Route path="/compress" element={<CompressPDF />} />
        <Route path="/convert" element={<ConvertPDF />} />
        <Route path="/ocr" element={<OCRTool />} />
        <Route path="/history" element={<History />} />
        <Route path="/reorder" element={<ReorderPDF />} />
        <Route path="/delete" element={<DeletePages />} />
        <Route path="/extract" element={<ExtractPages />} />
        <Route path="/export" element={<ExportPDF />} />
        <Route path="/password" element={<PasswordProtect />} />
        <Route path="/batch" element={<BatchProcess />} />

        {/* Redirect all unknown routes to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </Router>
  );
}

export default App;
