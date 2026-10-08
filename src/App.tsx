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
import { BriefcaseBusiness, GraduationCap, ShieldCheck, SlidersHorizontal, Loader2, School, UserRound } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, learnerProfile, updateLearnerProfile, logout, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [surveyModalOpen, setSurveyModalOpen] = useState<boolean>(false);
  const [accessibilityModalOpen, setAccessibilityModalOpen] = useState<boolean>(false);
  const [profileSetupSaving, setProfileSetupSaving] = useState(false);
  const [profileSetupError, setProfileSetupError] = useState<string | null>(null);

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

  if (!learnerProfile || !learnerProfile.profile_setup_completed || !['High School', 'College', 'Working'].includes(learnerProfile.grade_level)) {
    const educationOptions = [
      { value: 'High School', label: 'High School', description: 'I am currently in high school.', icon: School },
      { value: 'College', label: 'College', description: 'I am currently studying in college or university.', icon: GraduationCap },
      { value: 'Working', label: 'Working', description: 'I am currently working.', icon: BriefcaseBusiness },
    ];

    const handleProfileSetup = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const gradeLevel = formData.get('gradeLevel');
      if (typeof gradeLevel !== 'string' || !['High School', 'College', 'Working'].includes(gradeLevel)) {
        setProfileSetupError('Choose one option to continue.');
        return;
      }

      setProfileSetupSaving(true);
      setProfileSetupError(null);
      try {
        await updateLearnerProfile({
          grade_level: gradeLevel,
          profile_setup_completed: true,
        });
      } catch {
        setProfileSetupError('We could not save your choice. Please try again.');
      } finally {
        setProfileSetupSaving(false);
      }
    };

    return (
      <div className="auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-white">
        <div className="relative z-10 w-full max-w-2xl animate-fade-up">
          <header className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-lg font-bold">AccessiLearn</span>
          </header>

          <form onSubmit={handleProfileSetup} className="auth-panel rounded-3xl p-6 sm:p-8">
            <div className="mb-7">
              <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase text-cyan-200">
                <UserRound className="h-4 w-4" />
                Set up your learner profile
              </p>
              <h1 className="text-2xl font-black text-white sm:text-3xl">Which best describes you?</h1>
              <p className="mt-2 text-sm text-slate-300">Choose your current stage. You can change it later in your profile.</p>
              <p className="mt-3 text-xs text-slate-400">Signed in as {user.email}</p>
            </div>

            <fieldset className="grid gap-3 sm:grid-cols-3">
              <legend className="sr-only">Choose your current stage</legend>
              {educationOptions.map(({ value, label, description, icon: Icon }) => (
                <label key={value} className="cursor-pointer">
                  <input
                    className="peer sr-only"
                    type="radio"
                    name="gradeLevel"
                    value={value}
                    required
                  />
                  <span className="flex h-full min-h-36 flex-col rounded-2xl border border-slate-600 bg-slate-950/40 p-4 transition peer-checked:border-cyan-300 peer-checked:bg-cyan-400/10 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-cyan-300">
                    <Icon className="mb-4 h-5 w-5 text-cyan-200" />
                    <span className="font-bold text-white">{label}</span>
                    <span className="mt-1 text-xs leading-relaxed text-slate-300">{description}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            {profileSetupError && (
              <p role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {profileSetupError}
              </p>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={logout} className="px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white">
                Sign out
              </button>
              <button
                type="submit"
                disabled={profileSetupSaving}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                {profileSetupSaving ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
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
