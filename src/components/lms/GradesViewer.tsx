import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Volume2,
  FileCheck2,
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { ActivitySubmission, CourseActivity } from '../../types';

export const GradesViewer: React.FC = () => {
  const { learnerProfile } = useAuth();
  const { speakText } = useAccessibility();

  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [activities, setActivities] = useState<Record<string, CourseActivity>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Load activities from Firestore to map points and titles
  useEffect(() => {
    try {
      const q = query(collection(db, 'activities'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const actMap: Record<string, CourseActivity> = {};
        snapshot.forEach((doc) => {
          actMap[doc.id] = { ...(doc.data() as CourseActivity), id: doc.id };
        });
        setActivities(actMap);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Error loading activities for grades:', e);
    }
  }, []);

  // Load submissions strictly from Firestore for this learner
  useEffect(() => {
    if (!learnerProfile?.id) {
      setLoading(false);
      return;
    }

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
          setSubmissions(list);
          setLoading(false);
        },
        (error) => {
          console.warn('Error fetching submissions from Firestore:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Submissions query error:', err);
      setLoading(false);
    }
  }, [learnerProfile?.id]);

  // Compute stats from real Firestore data
  const gradedItems = submissions.filter((s) => s.status === 'graded' && typeof s.score === 'number');
  const totalScore = gradedItems.reduce((acc, curr) => acc + (curr.score || 0), 0);
  const totalMax = gradedItems.reduce((acc, curr) => {
    const act = activities[curr.activity_id];
    return acc + (act?.points || 100);
  }, 0);

  const averagePercentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Grades & Assessments</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time grades recorded in the Firestore database
          </p>
        </div>

        {submissions.length > 0 && (
          <button
            onClick={() =>
              speakText(
                `Grades summary for ${learnerProfile?.learner_name || 'learner'}. ${submissions.length} submissions in database, average score ${averagePercentage} percent.`
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
            aria-label="Read grades summary aloud"
          >
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span>Read Summary</span>
          </button>
        )}
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-slate-500">Graded Average</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {gradedItems.length > 0 ? `${averagePercentage}%` : 'N/A'}
            </span>
            {gradedItems.length > 0 && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Active
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-slate-500">Submissions in Database</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{submissions.length}</span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {gradedItems.length} Graded
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-slate-500">Educational Profile</p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900 truncate">
              {learnerProfile?.educational_need || 'Standard'}
            </span>
          </div>
        </div>
      </div>

      {/* Database Grades Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            Assessments & Submissions
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Loading grades from database...
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No submissions recorded in the database yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Submit your responses under the <strong>Activities</strong> tab to see your scores and instructor feedback saved here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Course Assessment Grades and Feedback">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Activity Title</th>
                  <th scope="col" className="px-5 py-3.5">Submitted On</th>
                  <th scope="col" className="px-5 py-3.5">Score</th>
                  <th scope="col" className="px-5 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => {
                  const act = activities[sub.activity_id];
                  const maxPts = act?.points || 50;
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900 max-w-xs">
                        <p>{sub.activity_title || act?.title || sub.activity_id}</p>
                        {sub.attachment_name && (
                          <span className="text-[10px] text-indigo-600 font-normal block mt-0.5">
                            Attachment: {sub.attachment_name}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-[11px]">
                        {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {sub.status === 'graded' && typeof sub.score === 'number' ? (
                          `${sub.score} / ${maxPts}`
                        ) : (
                          <span className="text-slate-400 font-normal italic">Pending review</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {sub.status === 'graded' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Graded</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Submitted</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600 max-w-md leading-relaxed">
                        {sub.feedback ? (
                          <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 italic">
                            "{sub.feedback}"
                          </p>
                        ) : (
                          <span className="text-slate-400 italic">No feedback provided yet.</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
