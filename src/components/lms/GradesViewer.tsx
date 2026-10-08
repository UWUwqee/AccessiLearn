import React from 'react';
import { Award, CheckCircle2, Clock, FileCheck2, Volume2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';

export const GradesViewer: React.FC = () => {
  const { classroomGrades, classroomLastSync, isClassroomSyncing, syncGoogleClassroom, authError } = useAuth();
  const { speakText } = useAccessibility();

  const gradedItems = classroomGrades.filter((item) => typeof item.assigned_grade === 'number');
  const submittedItems = classroomGrades.filter((item) => item.state === 'TURNED_IN' || item.state === 'RETURNED');
  const outstandingCount = classroomGrades.filter((item) =>
    item.state === 'NEW' || item.state === 'CREATED' || item.state === 'RECLAIMED_BY_STUDENT'
  ).length;
  const gradedItemsWithMaximum = gradedItems.filter((item) => item.max_points !== null && item.max_points > 0);
  const totalScore = gradedItemsWithMaximum.reduce((total, item) => total + (item.assigned_grade || 0), 0);
  const totalMaximum = gradedItemsWithMaximum.reduce((total, item) => total + (item.max_points || 0), 0);
  const averagePercentage = totalMaximum > 0 ? Math.round((totalScore / totalMaximum) * 100) : 0;

  const getStatus = (item: (typeof classroomGrades)[number]) => {
    if (typeof item.assigned_grade === 'number') return 'Graded';
    if (item.state === 'TURNED_IN') return 'Submitted, awaiting grade';
    if (item.state === 'RETURNED') return 'Returned';
    if (item.state === 'RECLAIMED_BY_STUDENT') return 'Resubmission needed';
    if (item.state === 'UNAVAILABLE') return 'Permission required';
    if (item.state !== 'NEW' && item.state !== 'CREATED') return 'Status unavailable';
    return 'Not submitted';
  };

  const sortedGrades = [...classroomGrades].sort((left, right) => {
    const priority = (item: typeof left) => {
      if (typeof item.assigned_grade === 'number') return 0;
      if (item.state === 'TURNED_IN' || item.state === 'RETURNED') return 1;
      if (item.state === 'NEW' || item.state === 'CREATED' || item.state === 'RECLAIMED_BY_STUDENT') return 2;
      return 3;
    };
    return priority(left) - priority(right) || left.course.localeCompare(right.course) || left.title.localeCompare(right.title);
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Google Classroom grades</h1>
          <p className="mt-1 text-sm text-slate-500">Your published coursework, submission status, and grades from Google Classroom.</p>
          <p className="mt-1 text-xs text-slate-400">{classroomLastSync ? `Last synced ${classroomLastSync}` : 'Not synced yet'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {classroomGrades.length > 0 && (
            <button
              type="button"
              onClick={() => speakText(`Google Classroom: ${gradedItems.length} graded, ${submittedItems.length} submitted, ${outstandingCount} not submitted. Average of graded work: ${averagePercentage} percent.`)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-200"
              aria-label="Read Classroom grades summary aloud"
            >
              <Volume2 className="h-4 w-4 text-emerald-600" />
              Read summary
            </button>
          )}
          <button
            type="button"
            onClick={syncGoogleClassroom}
            disabled={isClassroomSyncing}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isClassroomSyncing ? 'Syncing...' : 'Refresh Classroom'}
          </button>
        </div>
      </header>

      {authError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {authError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Graded average</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {gradedItemsWithMaximum.length > 0 ? `${averagePercentage}%` : 'N/A'}
            </span>
            <span className="text-xs text-emerald-700">{gradedItems.length} graded</span>
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Turned in</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{submittedItems.length}</span>
            <span className="text-xs text-amber-700">{outstandingCount} not submitted</span>
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Published coursework</p>
          <span className="mt-1 block text-3xl font-extrabold text-slate-900">{classroomGrades.length}</span>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Award className="h-5 w-5 text-indigo-600" />
            Coursework and grades
          </h2>
          <p className="mt-1 text-xs text-slate-500">Graded work first, followed by submitted work, then outstanding assignments.</p>
        </div>

        {isClassroomSyncing && classroomGrades.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading coursework from Google Classroom...</div>
        ) : classroomGrades.length === 0 ? (
          <div className="space-y-3 p-10 text-center">
            <FileCheck2 className="mx-auto h-8 w-8 text-slate-400" />
            <p className="text-sm font-bold text-slate-700">No Classroom coursework loaded</p>
            <p className="mx-auto max-w-sm text-xs text-slate-500">Refresh to load coursework for your connected account. No sample or local assignments are shown here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Google Classroom coursework and grades">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-700">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Course / Assignment</th>
                  <th scope="col" className="px-5 py-3.5">Due</th>
                  <th scope="col" className="px-5 py-3.5">Grade</th>
                  <th scope="col" className="px-5 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5">Classroom</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedGrades.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
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
                        {typeof item.assigned_grade === 'number' ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : <Clock className="mr-1 h-3.5 w-3.5" />}
                        {getStatus(item)}
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
    </div>
  );
};