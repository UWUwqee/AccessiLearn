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
  const { learnerProfile, classroomGrades, classroomLastSync, isClassroomSyncing, syncGoogleClassroom, authError } = useAuth();
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
  const classroomGradedItems = classroomGrades.filter((item) => typeof item.assigned_grade === 'number');
  const classroomSubmittedItems = classroomGrades.filter((item) => item.state === 'TURNED_IN' || item.state === 'RETURNED');
  const classroomOutstandingItems = classroomGrades.filter((item) =>
    item.state === 'NEW' || item.state === 'CREATED' || item.state === 'RECLAIMED_BY_STUDENT'
  ).length;
  const gradedClassroomItemsWithMaximum = classroomGradedItems.filter((item) => item.max_points !== null && item.max_points > 0);
  const totalScore = gradedClassroomItemsWithMaximum.reduce((total, item) => total + (item.assigned_grade || 0), 0);
  const totalMax = gradedClassroomItemsWithMaximum.reduce((total, item) => total + (item.max_points || 0), 0);

  const averagePercentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
  const sortedClassroomGrades = [...classroomGrades].sort((left, right) => {
    const priority = (item: typeof left) => typeof item.assigned_grade === 'number' ? 0 : item.state === 'TURNED_IN' || item.state === 'RETURNED' ? 1 : 2;
    return priority(left) - priority(right) || left.course.localeCompare(right.course) || left.title.localeCompare(right.title);
  });

  const getClassroomStatus = (item: (typeof classroomGrades)[number]) => {
    if (typeof item.assigned_grade === 'number') return 'Graded';
    if (item.state === 'TURNED_IN') return 'Submitted, awaiting grade';
    if (item.state === 'RETURNED') return 'Returned';
    if (item.state === 'RECLAIMED_BY_STUDENT') return 'Resubmission needed';
    if (item.state === 'UNAVAILABLE') return 'Permission required';
    if (item.state !== 'NEW' && item.state !== 'CREATED') return 'Status unavailable';
    return 'Not submitted';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Grades & Assessments</h1>
          <p className="text-xs text-slate-500 mt-1">
            Coursework, submission progress, and assigned grades from Google Classroom
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">
            {classroomLastSync ? `Last synced ${classroomLastSync}` : 'Not synced'}
          </span>
          <button
            type="button"
            onClick={syncGoogleClassroom}
            disabled={isClassroomSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs disabled:opacity-60"
          >
            <span>{isClassroomSyncing ? 'Syncing...' : 'Refresh Classroom'}</span>
          </button>
          {(classroomGrades.length > 0 || submissions.length > 0) && (
            <button
              type="button"
              onClick={() => speakText(`Google Classroom: ${classroomGradedItems.length} graded, ${classroomSubmittedItems.length} submitted, ${classroomOutstandingItems} not submitted. Average of graded work: ${averagePercentage} percent.`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
              aria-label="Read grades summary aloud"
            >
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span>Read Summary</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-slate-500">Classroom Graded Average</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {gradedClassroomItemsWithMaximum.length > 0 ? `${averagePercentage}%` : 'N/A'}
            </span>
            {gradedClassroomItemsWithMaximum.length > 0 && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                {classroomGradedItems.length} graded
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-slate-500">Turned In to Classroom</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{classroomSubmittedItems.length}</span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {classroomOutstandingItems} Not submitted
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-slate-500">Classroom Coursework</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {classroomGrades.length}
            </span>
            <span className="text-xs font-bold text-slate-500">Published items</span>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Google Classroom grades & activity
            </h2>
            <p className="mt-1 text-xs text-slate-500">Graded work first, then submitted work, then outstanding assignments.</p>
          </div>
        </div>

        {authError && (
          <p role="alert" className="m-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
            {authError}
          </p>
        )}

        {isClassroomSyncing && classroomGrades.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading coursework and grades from Google Classroom...</div>
        ) : classroomGrades.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No Classroom coursework to show</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Sign in with a Google account enrolled in a Classroom course, then refresh to load published assignments and grades.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Google Classroom coursework and grades">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Course / Assignment</th>
                  <th scope="col" className="px-5 py-3.5">Due</th>
                  <th scope="col" className="px-5 py-3.5">Grade</th>
                  <th scope="col" className="px-5 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5">Classroom</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedClassroomGrades.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{item.course}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{item.due_date}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {typeof item.assigned_grade === 'number'
                        ? `${item.assigned_grade}${item.max_points !== null ? ` / ${item.max_points}` : ''}`
                        : <span className="font-normal italic text-slate-400">Not graded</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-bold ${typeof item.assigned_grade === 'number' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : item.state === 'TURNED_IN' || item.state === 'RETURNED' ? 'border-blue-200 bg-blue-50 text-blue-800' : item.state === 'UNAVAILABLE' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                        {getClassroomStatus(item)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {item.alternateLink ? (
                        <a href={item.alternateLink} target="_blank" rel="noreferrer" className="font-semibold text-indigo-700 underline">
                          Open assignment
                        </a>
                      ) : <span className="text-slate-400">Unavailable</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* AccessiLearn submissions saved in Firestore, separate from Classroom grades */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-indigo-600" />
            AccessiLearn submissions
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
              This section shows responses submitted inside AccessiLearn. Google Classroom coursework and assigned grades appear in the table above.
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
