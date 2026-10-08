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
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
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
  const { learnerProfile, updateLearnerProfile } = useAuth();
  const { speakText } = useAccessibility();

  const [announcements, setAnnouncements] = useState<AnnouncementDoc[]>([]);
  const [activities, setActivities] = useState<CourseActivity[]>([]);

  // Load announcements from Firestore
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

  // Load activities from Firestore
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
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {learnerProfile?.learner_name || 'Learner'}!
            </h1>
            <p className="text-indigo-200 text-xs">
              {learnerProfile?.educational_need || 'Special Educational Needs'} • {learnerProfile?.grade_level || 'Student'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={onOpenAccessibility}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-white cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-300" />
              <span>Accessibility Features</span>
            </button>
            <button
              onClick={onOpenSurvey}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Evaluation Survey</span>
            </button>
          </div>
        </div>

        {/* Profile Details */}
        <div className="mt-5 pt-4 border-t border-indigo-700/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-indigo-950/60 rounded-xl p-3 border border-indigo-600/40 flex items-center justify-between">
            <span className="text-indigo-300 font-medium">Educational Need:</span>
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-amber-400" />
              <select
                value={learnerProfile?.educational_need || 'General / Control Group'}
                onChange={(e) => {
                  updateLearnerProfile({ educational_need: e.target.value as any });
                }}
                className="bg-indigo-900 text-amber-300 font-bold border border-indigo-600/50 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-amber-300 cursor-pointer"
                aria-label="Select special educational need category"
              >
                <option value="Visual Impairment">Visual Impairment</option>
                <option value="Hearing Impairment">Hearing Impairment</option>
                <option value="Motor Impairment">Motor Impairment</option>
                <option value="Cognitive / Dyslexia">Cognitive / Dyslexia</option>
                <option value="Low Vision / Color Blindness">Low Vision / Color Blindness</option>
                <option value="Multiple Needs">Multiple Needs</option>
                <option value="General / Control Group">General / Control Group</option>
              </select>
            </div>
          </div>
          <div className="bg-indigo-950/60 rounded-xl p-3 border border-indigo-600/40 flex items-center justify-between">
            <span className="text-indigo-300 font-medium">Assistive Tech:</span>
            <span className="font-semibold text-white truncate max-w-[200px]">
              {learnerProfile?.assistive_tech?.length ? learnerProfile.assistive_tech.join(', ') : 'Standard Display'}
            </span>
          </div>
        </div>
      </div>

      {/* Dedicated Special Accessibility Features Section Banner */}
      <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Special Accessibility Features</h2>
            <p className="text-xs text-slate-500">
              Customize text size, high-contrast themes, dyslexia typography, focus ruler, and audio speech.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenAccessibility}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-300" />
          <span>Open Features Panel</span>
        </button>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Learning Materials */}
        <button
          onClick={() => onNavigate('materials')}
          className="text-left bg-white hover:bg-indigo-50/50 p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-indigo-300 group focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
            Learning Materials
          </h2>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-600">
            <span>Open lessons</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Activities */}
        <button
          onClick={() => onNavigate('activities')}
          className="text-left bg-white hover:bg-indigo-50/50 p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-indigo-300 group focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
            Activities
          </h2>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-amber-700">
            <span>{activities.length} Available</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Messages */}
        <button
          onClick={() => onNavigate('communication')}
          className="text-left bg-white hover:bg-indigo-50/50 p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-indigo-300 group focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
            Messages
          </h2>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-purple-700">
            <span>Open chat</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Grades */}
        <button
          onClick={() => onNavigate('grades')}
          className="text-left bg-white hover:bg-indigo-50/50 p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-indigo-300 group focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
            <Award className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
            Grades
          </h2>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <span>View grades</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Announcements and Assigned Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Announcements (Firestore-backed) */}
        <section aria-labelledby="announcements-title" className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="announcements-title" className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              Announcements
            </h2>
            {announcements.length > 0 && (
              <button
                onClick={() => speakText(announcements.map((a) => `${a.title}. ${a.content}`).join(' '))}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1 cursor-pointer"
              >
                Listen
              </button>
            )}
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                No announcements posted in database yet.
              </div>
            ) : (
              announcements.map((ann) => (
                <article
                  key={ann.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {ann.author}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ann.date}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{ann.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                </article>
              ))
            )}
          </div>
        </section>

        {/* Right Column: Active Learning Activities & Deadlines */}
        <section aria-labelledby="activities-title" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="activities-title" className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-amber-600" />
              Activities
            </h2>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {activities.length} Active
            </span>
          </div>

          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                No activities found in database.
              </div>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 hover:border-amber-400 transition-colors"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {act.points} pts
                    </span>
                    <h3 className="font-bold text-slate-900 text-xs mt-1.5 line-clamp-2">
                      {act.title}
                    </h3>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Due: {act.due_date}</span>
                  </div>

                  <button
                    onClick={() => onNavigate('activities')}
                    className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Open Activity</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}

            {/* Quick Evaluation Prompt */}
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-amber-950">LMS Evaluation Survey</h3>
                <p className="text-amber-800 text-[11px]">Submit feedback to database</p>
              </div>
              <button
                onClick={onOpenSurvey}
                className="py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm transition-colors text-xs shrink-0 cursor-pointer"
              >
                Start Survey
              </button>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
};
