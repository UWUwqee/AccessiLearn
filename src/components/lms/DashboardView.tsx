import React, { useState, useEffect } from 'react';
import {
  Bell,
  BookOpen,
  FileCheck2,
  MessageSquare,
  Award,
  Clock,
  ArrowRight,
  HeartHandshake,
  SlidersHorizontal,
  CheckCircle2,
  Sparkles,
  MonitorCog,
  GraduationCap,
  Activity,
  Users,
} from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { CourseActivity } from '../../types';

interface AnnouncementDoc {
  id: string;
  title: string;
  author: string;
  date: string;
  content: string;
}

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenSurvey: () => void;
  onOpenAccessibility: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenSurvey,
  onOpenAccessibility,
}) => {
  const { learnerProfile, updateLearnerProfile, user, classroomActivities, isClassroomSyncing, classroomLastSync, syncGoogleClassroom } = useAuth();
  const { speakText } = useAccessibility();

  const [announcements, setAnnouncements] = useState<AnnouncementDoc[]>([]);
  const [activities, setActivities] = useState<CourseActivity[]>([]);

  const supportNeeds = [
    { label: 'Visual Impairments', count: 7, tone: 'bg-indigo-100 text-indigo-700' },
    { label: 'Hearing Impairments', count: 4, tone: 'bg-cyan-100 text-cyan-700' },
    { label: 'Motor Impairments', count: 3, tone: 'bg-amber-100 text-amber-700' },
    { label: 'Learning Disabilities', count: 8, tone: 'bg-emerald-100 text-emerald-700' },
    { label: 'Low Vision Support', count: 5, tone: 'bg-fuchsia-100 text-fuchsia-700' },
    { label: 'Multiple Needs', count: 2, tone: 'bg-rose-100 text-rose-700' },
  ];

  const classroomFeed = classroomActivities.length
    ? classroomActivities.slice(0, 3).map((activity) => ({
        course: activity.module,
        update: activity.title,
        due: activity.due_date,
        accent: 'bg-indigo-500',
      }))
    : [
        { course: 'Introduction to Inclusive Design', update: 'New assignment posted', due: 'Due tomorrow', accent: 'bg-indigo-500' },
        { course: 'Assistive Technology Lab', update: 'Instructor shared accessibility checklist', due: 'Due Friday', accent: 'bg-emerald-500' },
        { course: 'Academic Writing for Accessibility', update: 'Recorded lecture added', due: 'Due next Monday', accent: 'bg-amber-500' },
      ];

  useEffect(() => {
    try {
      const q = query(collection(db, 'announcements'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: AnnouncementDoc[] = [];
        snapshot.forEach((d) => {
          list.push({ ...(d.data() as AnnouncementDoc), id: d.id });
        });
        setAnnouncements(list);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Announcements firestore error:', e);
    }
  }, []);

  useEffect(() => {
    try {
      const q = query(collection(db, 'activities'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: CourseActivity[] = [];
        snapshot.forEach((d) => {
          list.push({ ...(d.data() as CourseActivity), id: d.id });
        });
        setActivities(list);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Activities firestore error:', e);
    }
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-2xl shadow-slate-900/20">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200">
              <MonitorCog className="h-3.5 w-3.5" />
              Accessibility dashboard
            </div>
            <h1 className="text-2xl font-black tracking-tight md:text-4xl">
              Welcome back, {learnerProfile?.learner_name || 'Learner'}.
            </h1>
            <p className="text-sm text-slate-300">
              {learnerProfile?.educational_need || 'Special educational support'} • {learnerProfile?.grade_level || 'Student'} • {user?.email || 'No Google account connected'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onOpenAccessibility}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <SlidersHorizontal className="h-4 w-4 text-amber-300" />
              Accessibility controls
            </button>
            <button
              onClick={onOpenSurvey}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              <FileCheck2 className="h-4 w-4" />
              Evaluation survey
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-indigo-500/20 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Google Classroom</p>
                <p className="mt-2 text-lg font-bold text-white">{classroomActivities.length ? 'Connected and syncing' : 'No classroom activity yet'}</p>
              </div>
              <button
                onClick={syncGoogleClassroom}
                disabled={isClassroomSyncing}
                className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300 transition hover:bg-emerald-500/15 disabled:opacity-60"
              >
                {isClassroomSyncing ? 'Syncing...' : classroomActivities.length ? 'Refresh' : 'Sync'}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {classroomFeed.map((item) => (
                <div key={`${item.course}-${item.update}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.accent}`} />
                    <div>
                      <p className="text-sm font-semibold text-white">{item.course}</p>
                      <p className="text-xs text-slate-400">{item.update}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-300">{item.due}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-700 pt-3 text-[11px] text-slate-300">
              <span>Last sync</span>
              <span className="font-semibold text-indigo-200">{classroomLastSync || (classroomActivities.length ? 'Just now' : 'Not connected')}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Profile summary</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 p-3">
                <span className="text-sm text-slate-300">Educational need</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-2 py-1 text-xs font-bold text-indigo-200">
                  <HeartHandshake className="h-3.5 w-3.5 text-amber-300" />
                  {learnerProfile?.educational_need || 'General / Control Group'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-700 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-300">Assistive technology</span>
                  <span className="text-xs font-bold text-emerald-300">Enabled</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(learnerProfile?.assistive_tech?.length ? learnerProfile.assistive_tech : ['Screen Reader', 'High Contrast']).map((tech) => (
                    <span key={tech} className="rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-200">{tech}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Learning Materials', icon: BookOpen, action: () => onNavigate('materials'), tone: 'bg-blue-100 text-blue-700', accent: 'text-blue-700' },
          { label: 'Activities', icon: FileCheck2, action: () => onNavigate('activities'), tone: 'bg-amber-100 text-amber-700', accent: 'text-amber-700', count: activities.length },
          { label: 'Messages', icon: MessageSquare, action: () => onNavigate('communication'), tone: 'bg-purple-100 text-purple-700', accent: 'text-purple-700' },
          { label: 'Grades', icon: Award, action: () => onNavigate('grades'), tone: 'bg-emerald-100 text-emerald-700', accent: 'text-emerald-700' },
        ].map(({ label, icon: Icon, action, tone, accent, count }) => (
          <button
            key={label}
            onClick={action}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          >
            <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">{label}</h3>
            <div className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${accent}`}>
              <span>{count !== undefined ? `${count} Available` : 'Open now'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Activity className="h-5 w-5 text-amber-600" />
              Active learning tasks
            </h2>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
              {classroomActivities.length || activities.length} active
            </span>
          </div>

          <div className="space-y-3">
            {classroomActivities.length ? (
              classroomActivities.slice(0, 4).map((act) => (
                <div key={act.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700">
                      {act.points} pts
                    </span>
                    <Clock className="h-4 w-4 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{act.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{act.module}</p>
                  <p className="mt-1 text-xs text-slate-500">Due: {act.due_date}</p>
                  <button
                    onClick={() => onNavigate('activities')}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Open task
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            ) : activities.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-xs text-slate-500">
                No tasks found in the classroom feed yet.
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700">
                      {act.points} pts
                    </span>
                    <Clock className="h-4 w-4 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{act.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">Due: {act.due_date}</p>
                  <button
                    onClick={() => onNavigate('activities')}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Open task
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Bell className="h-5 w-5 text-indigo-600" />
            Announcements
          </h2>
          {announcements.length > 0 && (
            <button
              onClick={() => speakText(announcements.map((a) => `${a.title}. ${a.content}`).join(' '))}
              className="text-[11px] font-semibold text-indigo-600 underline"
            >
              Listen
            </button>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {announcements.length === 0 ? (
            <p className="text-xs text-slate-500">No announcements posted yet.</p>
          ) : (
            announcements.slice(0, 3).map((ann) => (
              <article key={ann.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700">
                    {ann.author}
                  </span>
                  <span className="text-[10px] text-slate-400">{ann.date}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{ann.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{ann.content}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
