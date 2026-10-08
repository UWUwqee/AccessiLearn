import React, { useMemo } from 'react';
import { ArrowUpRight, BookOpen, FileText, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ClassroomMaterialsViewer: React.FC = () => {
  const {
    classroomCourses,
    classroomMaterials,
    classroomLastSync,
    isClassroomSyncing,
    syncGoogleClassroom,
    authError,
  } = useAuth();

  const materialsByCourse = useMemo(
    () => classroomMaterials.reduce<Record<string, typeof classroomMaterials>>((grouped, material) => {
      grouped[material.courseId] ||= [];
      grouped[material.courseId].push(material);
      return grouped;
    }, {}),
    [classroomMaterials]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Google Classroom materials</h1>
          <p className="mt-1 text-sm text-slate-500">Resources and links shared in your enrolled Google Classroom subjects.</p>
          <p className="mt-1 text-xs text-slate-400">{classroomLastSync ? `Last synced ${classroomLastSync}` : 'Not synced yet'}</p>
        </div>
        <button
          type="button"
          onClick={syncGoogleClassroom}
          disabled={isClassroomSyncing}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isClassroomSyncing ? 'animate-spin' : ''}`} />
          {isClassroomSyncing ? 'Syncing...' : 'Refresh Classroom'}
        </button>
      </header>

      {authError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {authError}
        </p>
      )}

      {classroomCourses.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <BookOpen className="mx-auto h-9 w-9 text-slate-400" />
          <h2 className="mt-4 text-base font-bold text-slate-800">No enrolled Classroom subjects loaded</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Refresh Google Classroom to load subjects you are currently enrolled in and their shared materials.
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          {classroomCourses.map((course) => {
            const courseMaterials = materialsByCourse[course.id] || [];

            return (
              <section key={course.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{course.name}</h2>
                    {course.section && <p className="mt-1 text-xs text-slate-500">{course.section}</p>}
                  </div>
                  {course.alternateLink && (
                    <a
                      href={course.alternateLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      Open subject <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </header>

                {courseMaterials.length === 0 ? (
                  <p className="pt-4 text-sm text-slate-500">No linked materials were shared in this subject.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {courseMaterials.map((material) => (
                      <li key={material.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-4">
                        {material.thumbnailUrl ? (
                          <img src={material.thumbnailUrl} alt="" className="h-12 w-16 rounded-lg object-cover" />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <FileText className="h-5 w-5" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">{material.type}</p>
                          <a
                            href={material.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-slate-900 hover:text-indigo-700"
                          >
                            {material.title}
                            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                          </a>
                          <p className="mt-1 text-xs text-slate-500">Shared with: {material.courseworkTitle}</p>
                          {material.description && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{material.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
