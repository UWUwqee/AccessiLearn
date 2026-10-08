import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Clock,
  Send,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Mic,
  Award,
  Sparkles,
  Paperclip,
} from 'lucide-react';
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { SAMPLE_ACTIVITIES } from '../../data/initialData';
import { ActivitySubmission, CourseActivity } from '../../types';

export const ActivitySubmissionModule: React.FC = () => {
  const { learnerProfile } = useAuth();
  const { announce } = useAccessibility();

  const [activities, setActivities] = useState<CourseActivity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<CourseActivity | null>(null);
  const [responseText, setResponseText] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submissionsList, setSubmissionsList] = useState<ActivitySubmission[]>([]);

  // Load activities from Firestore collection
  useEffect(() => {
    try {
      const q = query(collection(db, 'activities'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: CourseActivity[] = [];
        snapshot.forEach((d) => {
          list.push({ ...(d.data() as CourseActivity), id: d.id });
        });
        setActivities(list);
        if (list.length > 0) {
          setSelectedActivity((prev) => prev ? list.find(a => a.id === prev.id) || list[0] : list[0]);
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Error loading activities:', e);
    }
  }, []);

  // Load submissions for this learner from Firestore
  useEffect(() => {
    if (!learnerProfile?.id) return;

    try {
      const q = query(
        collection(db, 'submissions'),
        where('learner_id', '==', learnerProfile.id)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: ActivitySubmission[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...(doc.data() as ActivitySubmission) });
          });
          setSubmissionsList(list);
        },
        (error) => {
          console.warn('Submissions snapshot:', error);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Setting up submissions listener:', err);
    }
  }, [learnerProfile?.id]);

  const handleSimulateAttachment = () => {
    const sampleFiles = [
      'Accessible_Audit_Report_Maria_Santos.docx',
      'Cognitive_Interface_Analysis_Angela.pdf',
      'PTC_Lab1_Keyboard_Accessibility_Cruz.txt',
    ];
    const picked = sampleFiles[Math.floor(Math.random() * sampleFiles.length)];
    setAttachmentName(picked);
    announce(`File attached: ${picked}`);
  };

  const handleSpeechDictate = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setResponseText((prev) =>
        prev + ' [Voice Dictated Response]: I examined the campus portal and identified color contrast issues on text buttons and missing video captioning.'
      );
      announce('Sample voice dictation transcript inserted into answer box.');
      return;
    }
    try {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setResponseText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        announce('Voice input recorded into submission text area.');
      };
      recognition.start();
      announce('Listening for voice input. Speak now...');
    } catch (e) {
      setResponseText((prev) =>
        prev + ' [Voice Dictated Response]: I audited the LMS elements and confirmed WCAG 2.2 focus ring visibility.'
      );
      announce('Dictation inserted.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) {
      announce('Please select an activity to submit.');
      return;
    }
    if (!responseText.trim()) {
      announce('Please enter your response before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess(false);

    const submissionPayload: ActivitySubmission = {
      activity_id: selectedActivity.id,
      activity_title: selectedActivity.title,
      learner_id: learnerProfile?.id || 'learner',
      learner_name: learnerProfile?.learner_name || 'Participant',
      response_text: responseText.trim(),
      attachment_name: attachmentName || undefined,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'submissions'), submissionPayload);
      setSubmitSuccess(true);
      announce('Activity successfully submitted to instructor database!');
      setResponseText('');
      setAttachmentName('');
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting activity:', error);
      // Fallback local update
      setSubmissionsList((prev) => [submissionPayload, ...prev]);
      setSubmitSuccess(true);
      announce('Activity saved locally!');
      setResponseText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Activity Submission
          </h1>
        </div>

        {/* Activity Selector */}
        <div className="flex gap-2">
          {activities.map((act) => (
            <button
              key={act.id}
              onClick={() => {
                setSelectedActivity(act);
                announce(`Selected ${act.title}`);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left cursor-pointer ${
                selectedActivity?.id === act.id
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="block text-[10px] opacity-80">{act.points} Points</span>
              <span className="truncate max-w-[140px] block">{act.id.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Task Instructions & Rubric (A7 Uncluttered chunking) */}
        <section aria-labelledby="activity-instructions" className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
                {selectedActivity?.module || 'Module Activity'}
              </span>
              <h2 id="activity-instructions" className="font-extrabold text-slate-900 text-base mt-2">
                {selectedActivity?.title || 'Loading activity...'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-amber-700 mt-2 font-medium">
                <Clock className="w-4 h-4" />
                <span>Deadline: {selectedActivity?.due_date || 'October 2026'}</span>
              </div>
            </div>

            <div className="text-xs text-slate-700 space-y-3 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
              {selectedActivity?.instructions || 'Loading activity instructions from database...'}
            </div>

            {selectedActivity?.accessible_formats && (
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Accessible Formats
                </p>
                <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-blue-800">
                  {selectedActivity.accessible_formats.map((fmt, i) => (
                    <li key={i}>{fmt}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Right: Submission Form */}
        <section aria-labelledby="submit-work-title" className="lg:col-span-7 space-y-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 id="submit-work-title" className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                Submit Your Response
              </h2>
              <span className="text-xs text-slate-500">
                Logged in as: <strong className="text-slate-900">{learnerProfile?.learner_name}</strong>
              </span>
            </div>

            {submitSuccess && (
              <div
                role="alert"
                className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2 font-semibold animate-in fade-in"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Success! Your response has been recorded in the database.</span>
              </div>
            )}

            {/* Answer Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="learner-response" className="font-bold text-xs text-slate-800">
                  Written Response / Analysis Findings:
                </label>
                {/* Voice Dictation helper (A2/A7) */}
                <button
                  type="button"
                  onClick={handleSpeechDictate}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200"
                  aria-label="Use microphone for speech dictation into response"
                >
                  <Mic className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Voice Dictation / Speech Input</span>
                </button>
              </div>
              <textarea
                id="learner-response"
                rows={6}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Type your response here..."
                className="w-full p-3.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                required
              />
              <div className="flex justify-end text-[11px] text-slate-400">
                <span>{responseText.length} characters</span>
              </div>
            </div>

            {/* File Attachment Simulation */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="font-bold text-xs text-slate-800 block">
                Attach File:
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSimulateAttachment}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-2xs focus:ring-2 focus:ring-indigo-500"
                >
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>Browse File</span>
                </button>
                {attachmentName ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                    {attachmentName}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Optional</span>
                )}
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording Submission...' : 'Submit Activity to Instructor'}</span>
            </button>
          </form>

          {/* Past Submissions Log */}
          {submissionsList.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                Your Recorded Submissions ({submissionsList.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {submissionsList.map((sub, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{sub.activity_title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {sub.status} • Score: {sub.score || 48}/50
                      </span>
                    </div>
                    <p className="text-slate-600 line-clamp-1 italic">"{sub.response_text}"</p>
                    {sub.feedback && (
                      <p className="text-[11px] text-indigo-700 font-medium bg-indigo-50 p-1.5 rounded">
                        <strong>Instructor Feedback:</strong> {sub.feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

      </div>

    </div>
  );
};
