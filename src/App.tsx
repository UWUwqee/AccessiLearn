import React, { useState } from 'react';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { AccessibilitySection } from './components/layout/AccessibilitySection';
import { Navbar } from './components/layout/Navbar';
import { ReadingRuler } from './components/layout/ReadingRuler';
import { DashboardView } from './components/lms/DashboardView';
import { LearningMaterialsViewer } from './components/lms/LearningMaterialsViewer';
import { ActivitySubmissionModule } from './components/lms/ActivitySubmissionModule';
import { CommunicationInterface } from './components/lms/CommunicationInterface';
import { GradesViewer } from './components/lms/GradesViewer';
import { ResearcherDashboard } from './components/researcher/ResearcherDashboard';
import { EvaluationModal } from './components/evaluation/EvaluationModal';
import { GraduationCap, ShieldCheck, SlidersHorizontal, Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [surveyModalOpen, setSurveyModalOpen] = useState<boolean>(false);
  const [accessibilityModalOpen, setAccessibilityModalOpen] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300">Loading AccessiLearn...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans transition-colors duration-200">
      {/* Reading Ruler Guide */}
      <ReadingRuler />

      {/* Main Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openSurveyModal={() => setSurveyModalOpen(true)}
        openAccessibilityModal={() => setAccessibilityModalOpen(true)}
      />

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 outline-none">
        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenSurvey={() => setSurveyModalOpen(true)}
            onOpenAccessibility={() => setAccessibilityModalOpen(true)}
          />
        )}

        {currentTab === 'materials' && <LearningMaterialsViewer />}

        {currentTab === 'activities' && <ActivitySubmissionModule />}

        {currentTab === 'communication' && <CommunicationInterface />}

        {currentTab === 'grades' && <GradesViewer />}

        {currentTab === 'researcher' && <ResearcherDashboard />}
      </main>

      {/* Dedicated Accessibility Features Section Modal */}
      <AccessibilitySection
        isOpen={accessibilityModalOpen}
        onClose={() => setAccessibilityModalOpen(false)}
      />

      {/* Post-Experience Evaluation Modal */}
      <EvaluationModal
        isOpen={surveyModalOpen}
        onClose={() => setSurveyModalOpen(false)}
        onSurveySubmitted={() => {
          setCurrentTab('researcher');
        }}
      />

      {/* Quick Access Floating Button for Accessibility Features */}
      <button
        onClick={() => setAccessibilityModalOpen(true)}
        className="fixed bottom-5 right-5 z-40 bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-300 active:scale-95 transition-all cursor-pointer border border-indigo-400/30"
        aria-label="Open special accessibility features settings"
      >
        <SlidersHorizontal className="w-5 h-5 text-amber-300" aria-hidden="true" />
        <span className="hidden sm:inline">Accessibility Controls</span>
      </button>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <GraduationCap className="w-5 h-5 text-amber-400" />
              <span>AccessiLearn</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                RA 11650
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                WCAG 2.2 AAA
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <AppContent />
      </AccessibilityProvider>
    </AuthProvider>
  );
}
