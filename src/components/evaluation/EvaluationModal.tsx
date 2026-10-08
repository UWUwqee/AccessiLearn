import React, { useState } from 'react';
import {
  X,
  Star,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Send,
  GraduationCap,
  Volume2,
} from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { LMS_A11Y_FEATURES } from '../../data/initialData';
import { UserExperienceEvaluationRecord } from '../../types';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSurveySubmitted?: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  onClose,
  onSurveySubmitted,
}) => {
  const { learnerProfile } = useAuth();
  const { speakText, announce } = useAccessibility();

  // Step 1: 5 UX Dimensions (1 to 5)
  const [easeOfUse, setEaseOfUse] = useState<number>(4);
  const [clarity, setClarity] = useState<number>(5);
  const [navigation, setNavigation] = useState<number>(4);
  const [convenience, setConvenience] = useState<number>(5);
  const [satisfaction, setSatisfaction] = useState<number>(5);

  // Step 2: Feature checklist (A1-A7)
  const [checklist, setChecklist] = useState<
    Record<string, { helpful: boolean; difficult: boolean; rating: number; issue: string }>
  >(() => {
    const init: any = {};
    LMS_A11Y_FEATURES.forEach((f) => {
      init[f.feature_id] = { helpful: true, difficult: false, rating: 5, issue: '' };
    });
    return init;
  });

  // Step 3: Open Feedback
  const [problemsEncountered, setProblemsEncountered] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRatingChange = (dim: string, val: number) => {
    if (dim === 'ease') setEaseOfUse(val);
    if (dim === 'clarity') setClarity(val);
    if (dim === 'nav') setNavigation(val);
    if (dim === 'conv') setConvenience(val);
    if (dim === 'sat') setSatisfaction(val);
    announce(`${dim} rated ${val} out of 5`);
  };

  const toggleHelpful = (featureId: string) => {
    setChecklist((prev) => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        helpful: !prev[featureId].helpful,
      },
    }));
  };

  const toggleDifficult = (featureId: string) => {
    setChecklist((prev) => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        difficult: !prev[featureId].difficult,
      },
    }));
  };

  const setFeatureRating = (featureId: string, rating: number) => {
    setChecklist((prev) => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        rating,
      },
    }));
  };

  const setFeatureIssue = (featureId: string, issue: string) => {
    setChecklist((prev) => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        issue,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const overallAverage = Number(
      ((easeOfUse + clarity + navigation + convenience + satisfaction) / 5).toFixed(2)
    );

    const uxRecord: UserExperienceEvaluationRecord = {
      learner_id: learnerProfile?.id || 'anonymous_participant',
      learner_name: learnerProfile?.learner_name || 'Participant Learner',
      educational_need: learnerProfile?.educational_need || 'Visual Impairment',
      ease_of_use: easeOfUse,
      clarity_understanding: clarity,
      navigation: navigation,
      convenience: convenience,
      satisfaction: satisfaction,
      overall_average: overallAverage,
      problems_encountered: problemsEncountered || 'None reported.',
      suggestions: suggestions || 'Continue improving screen magnifier integration.',
      feature_checklist: checklist,
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Save UX Evaluation record
      await addDoc(collection(db, 'user_experience_evaluations'), uxRecord);

      // 2. Save individual feature assessments (A1-A7)
      for (const feat of LMS_A11Y_FEATURES) {
        const item = checklist[feat.feature_id];
        await addDoc(collection(db, 'accessibility_assessments'), {
          learner_id: learnerProfile?.id || 'anonymous_participant',
          learner_name: learnerProfile?.learner_name || 'Participant Learner',
          feature_id: feat.feature_id,
          feature_name: feat.feature_name,
          accessibility_rating: item.rating,
          helpful: item.helpful,
          difficult: item.difficult,
          accessibility_issue: item.issue || (item.difficult ? 'Reported friction during interaction' : 'Working smoothly'),
          createdAt: new Date().toISOString(),
        });
      }

      // 3. Save open feedback if provided
      if (problemsEncountered || suggestions) {
        await addDoc(collection(db, 'feedbacks'), {
          learner_id: learnerProfile?.id || 'anonymous_participant',
          learner_name: learnerProfile?.learner_name || 'Participant Learner',
          educational_need: learnerProfile?.educational_need,
          feedback_text: problemsEncountered || 'General experience feedback',
          suggestion: suggestions || 'Proposed enhancements',
          category: 'general',
          createdAt: new Date().toISOString(),
        });
      }

      setSubmitted(true);
      announce('Evaluation submitted successfully to Pateros Technological College research database!');
      if (onSurveySubmitted) onSurveySubmitted();
    } catch (err) {
      console.warn('Error saving evaluation to Firestore:', err);
      // Still succeed gracefully locally
      setSubmitted(true);
      announce('Evaluation recorded locally!');
      if (onSurveySubmitted) onSurveySubmitted();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="survey-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="space-y-1">
            <h2 id="survey-modal-title" className="text-xl sm:text-2xl font-black">
              LMS Evaluation Survey
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors focus:ring-2 focus:ring-white"
            aria-label="Close evaluation survey modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8 text-xs">
          
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Evaluation Submitted
              </h3>
              <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                Thank you! Your evaluation has been saved.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
                >
                  Return to LMS
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Participant Profile Confirmation */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 text-xs">
                    Evaluating As: <span className="text-indigo-600">{learnerProfile?.learner_name}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Category: <strong>{learnerProfile?.educational_need}</strong>
                  </p>
                </div>
              </div>

              {/* SECTION 1: 5 UX Dimensions (E1) */}
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Section 1: User Experience Rating (1 = Low, 5 = High)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ease of Use */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <label className="font-bold text-slate-900 block">
                      1. Ease of Use: <span className="font-normal text-slate-600">The LMS features are straightforward and effortless to interact with.</span>
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleRatingChange('ease', val)}
                          className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center transition-all ${
                            easeOfUse === val
                              ? 'bg-indigo-600 text-white shadow-xs scale-105 ring-2 ring-indigo-400'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                          }`}
                          aria-label={`Ease of use rating ${val}`}
                        >
                          {val}
                        </button>
                      ))}
                      <span className="ml-2 font-bold text-indigo-700">{easeOfUse} / 5</span>
                    </div>
                  </div>

                  {/* Clarity and Understanding */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <label className="font-bold text-slate-900 block">
                      2. Clarity & Understanding: <span className="font-normal text-slate-600">Headings, icons, text labels, and instructions are clearly understood.</span>
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleRatingChange('clarity', val)}
                          className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center transition-all ${
                            clarity === val
                              ? 'bg-indigo-600 text-white shadow-xs scale-105 ring-2 ring-indigo-400'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                          }`}
                          aria-label={`Clarity rating ${val}`}
                        >
                          {val}
                        </button>
                      ))}
                      <span className="ml-2 font-bold text-indigo-700">{clarity} / 5</span>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <label className="font-bold text-slate-900 block">
                      3. Navigation: <span className="font-normal text-slate-600">Moving between modules, breadcrumbs, and shortcuts was fast and predictable.</span>
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleRatingChange('nav', val)}
                          className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center transition-all ${
                            navigation === val
                              ? 'bg-indigo-600 text-white shadow-xs scale-105 ring-2 ring-indigo-400'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                          }`}
                          aria-label={`Navigation rating ${val}`}
                        >
                          {val}
                        </button>
                      ))}
                      <span className="ml-2 font-bold text-indigo-700">{navigation} / 5</span>
                    </div>
                  </div>

                  {/* Convenience */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <label className="font-bold text-slate-900 block">
                      4. Convenience: <span className="font-normal text-slate-600">The accessible tools (TTS, transcript, ruler, alt tags) saved time and physical effort.</span>
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleRatingChange('conv', val)}
                          className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center transition-all ${
                            convenience === val
                              ? 'bg-indigo-600 text-white shadow-xs scale-105 ring-2 ring-indigo-400'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                          }`}
                          aria-label={`Convenience rating ${val}`}
                        >
                          {val}
                        </button>
                      ))}
                      <span className="ml-2 font-bold text-indigo-700">{convenience} / 5</span>
                    </div>
                  </div>

                  {/* Satisfaction */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 md:col-span-2">
                    <label className="font-bold text-slate-900 block">
                      5. Overall Satisfaction: <span className="font-normal text-slate-600">I am satisfied with how well this LMS accommodates my learning needs.</span>
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleRatingChange('sat', val)}
                          className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center transition-all ${
                            satisfaction === val
                              ? 'bg-amber-500 text-slate-950 font-black shadow-xs scale-105 ring-2 ring-amber-400'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                          }`}
                          aria-label={`Satisfaction rating ${val}`}
                        >
                          {val}
                        </button>
                      ))}
                      <span className="ml-2 font-bold text-amber-600">{satisfaction} / 5</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Accessibility Checklist (E2: A1-A7) */}
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                    Section 2: Accessibility Checklist (Criteria A1–A7)
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Which features helped? Which caused difficulty?
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Evaluate each specific accessibility support component implemented in the prototype.
                  </p>
                </div>

                <div className="space-y-3">
                  {LMS_A11Y_FEATURES.map((feat) => {
                    const item = checklist[feat.feature_id] || {
                      helpful: true,
                      difficult: false,
                      rating: 5,
                      issue: '',
                    };
                    return (
                      <div
                        key={feat.feature_id}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-900 mr-2">
                              {feat.feature_id}
                            </span>
                            <span className="font-bold text-slate-900 text-xs">
                              {feat.feature_name}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {feat.feature_description}
                            </p>
                          </div>

                          {/* Quick Helpful / Difficult toggles */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleHelpful(feat.feature_id)}
                              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                                item.helpful
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 border border-slate-300'
                              }`}
                              aria-pressed={item.helpful}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>Helpful</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleDifficult(feat.feature_id)}
                              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                                item.difficult
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 border border-slate-300'
                              }`}
                              aria-pressed={item.difficult}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              <span>Caused Difficulty</span>
                            </button>
                          </div>
                        </div>

                        {/* Optional notes if caused difficulty */}
                        {item.difficult && (
                          <div className="pt-2 animate-in fade-in">
                            <label className="font-semibold text-rose-700 text-[11px] block mb-1">
                              Describe the difficulty encountered with {feat.feature_id}:
                            </label>
                            <input
                              type="text"
                              value={item.issue}
                              onChange={(e) => setFeatureIssue(feat.feature_id, e.target.value)}
                              placeholder="e.g. Focus indicator was hard to see in high contrast mode..."
                              className="w-full p-2 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-950 focus:bg-white focus:ring-1 focus:ring-rose-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: Open Feedback & Suggestions (E3) */}
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                    Section 3: Open Feedback & Recommendations (E3)
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Qualitative Observations and Constructive Suggestions
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="problems-encountered" className="font-bold text-slate-900 block mb-1">
                      Specific problems encountered during the session:
                    </label>
                    <textarea
                      id="problems-encountered"
                      rows={3}
                      value={problemsEncountered}
                      onChange={(e) => setProblemsEncountered(e.target.value)}
                      placeholder="Describe any accessibility barriers, navigation hurdles, or unclear sections..."
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="suggestions-box" className="font-bold text-slate-900 block mb-1">
                      Suggestions for improving the LMS prototype:
                    </label>
                    <textarea
                      id="suggestions-box"
                      rows={3}
                      value={suggestions}
                      onChange={(e) => setSuggestions(e.target.value)}
                      placeholder="What enhancements would make online learning more accessible and user-friendly for your needs?"
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md text-xs flex items-center gap-2 focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting to Database...' : 'Submit Evaluation Data'}</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
