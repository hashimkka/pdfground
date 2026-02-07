import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { UpdateNotification } from './components/UpdateNotification';
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
        {/* Onboarding flow - only accessible if not completed */}
        <Route
          path="/"
          element={hasCompletedOnboarding ? <Navigate to="/dashboard" replace /> : <Welcome />}
        />
        <Route
          path="/how-it-works"
          element={hasCompletedOnboarding ? <Navigate to="/dashboard" replace /> : <HowItWorks />}
        />
        <Route
          path="/choose-plan"
          element={hasCompletedOnboarding ? <Navigate to="/dashboard" replace /> : <ChoosePlan />}
        />
        <Route
          path="/pro-access"
          element={hasCompletedOnboarding ? <Navigate to="/dashboard" replace /> : <ProAccess />}
        />

        {/* Main app routes */}
        <Route path="/dashboard" element={<Dashboard />} />
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

        {/* Redirect all unknown routes */}
        <Route
          path="*"
          element={<Navigate to={hasCompletedOnboarding ? "/dashboard" : "/"} replace />}
        />
      </Routes>
      <UpdateNotification />
    </Router>
  );
}

export default App;
