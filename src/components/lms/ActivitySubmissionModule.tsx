import React from 'react';
import { ArrowUpRight, BookOpenCheck, Clock, FileCheck2, RefreshCw, Volume2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';

export const ActivitySubmissionModule: React.FC = () => {
  const {
    classroomActivities,
    classroomGrades,
    classroomLastSync,
    isClassroomSyncing,
    syncGoogleClassroom,
    authError,
  } = useAuth();
  const { speakText } = useAccessibility();
  const gradeById = new Map(classroomGrades.map((grade) => [grade.id, grade]));

  const getStatus = (activityId: string) => {
    const grade = gradeById.get(activityId);
    if (!grade || grade.state === 'UNAVAILABLE') return 'Status unavailable';
    if (typeof grade.assigned_grade === 'number') {
      return `Graded: ${grade.assigned_grade}${grade.max_points !== null ? ` / ${grade.max_points}` : ''}`;
    }
    if (grade.state === 'TURNED_IN') return 'Turned in, awaiting grade';
    if (grade.state === 'RETURNED') return 'Returned';
    if (grade.state === 'RECLAIMED_BY_STUDENT') return 'Resubmission needed';
    return 'Not submitted';
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Google Classroom assignments</h1>
          <p className="mt-1 text-sm text-slate-500">Published coursework and submission status from your connected Classroom account.</p>
          <p className="mt-1 text-xs text-slate-400">{classroomLastSync ? `Last synced ${classroomLastSync}` : 'Not synced yet'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {classroomActivities.length > 0 && (
            <button
              type="button"
              onClick={() => speakText(classroomActivities.map((activity) => `${activity.title}. ${getStatus(activity.id)}. Due ${activity.due_date}.`).join(' '))}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Volume2 className="h-4 w-4" />
              Read assignments
            </button>
          )}
          <button
            type="button"
            onClick={syncGoogleClassroom}
            disabled={isClassroomSyncing}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isClassroomSyncing ? 'animate-spin' : ''}`} />
            {isClassroomSyncing ? 'Syncing...' : 'Refresh Classroom'}
          </button>
        </div>
      </header>

      {authError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {authError}
        </p>
      )}

      {classroomActivities.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <BookOpenCheck className="mx-auto h-9 w-9 text-slate-400" />
          <h2 className="mt-4 text-base font-bold text-slate-800">No Classroom assignments loaded</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Sync a Google account that is enrolled in a Classroom course. Only coursework returned by Google Classroom appears here.
          </p>
        </section>
      ) : (
        <section aria-label="Google Classroom assignments" className="grid gap-4 lg:grid-cols-2">
          {classroomActivities.map((activity) => (
            <article key={activity.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-indigo-700">{activity.module}</p>
                  <h2 className="mt-2 text-base font-bold text-slate-900">{activity.title}</h2>
                </div>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                  {activity.points} pts
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Due {activity.due_date}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileCheck2 className="h-3.5 w-3.5" />
                  {getStatus(activity.id)}
                </span>
              </div>

              {activity.instructions !== 'No description provided for this activity yet.' && (
                <p className="mt-4 line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {activity.instructions}
                </p>
              )}

              {activity.alternateLink && (
                <a
                  href={activity.alternateLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                >
                  Open assignment in Classroom
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
};