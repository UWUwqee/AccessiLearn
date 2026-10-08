import React, { useEffect, useState } from 'react';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { AlertCircle, Megaphone, Send, Users } from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { ActivitySubmission, AnnouncementDoc } from '../../types';

export const InstructorWorkspace: React.FC = () => {
  const { user, learnerProfile } = useAuth();
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementDoc[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribeSubmissions = onSnapshot(
      query(collection(db, 'submissions'), orderBy('submitted_at', 'desc')),
      (snapshot) => setSubmissions(snapshot.docs.map((item) => ({
        ...item.data(),
        id: item.id,
      } as ActivitySubmission))),
      (snapshotError) => {
        console.error('Instructor submissions subscription error:', snapshotError);
        setError('Unable to load learner submissions.');
      }
    );
    const unsubscribeAnnouncements = onSnapshot(
      query(collection(db, 'announcements'), orderBy('date', 'desc')),
      (snapshot) => setAnnouncements(snapshot.docs.map((item) => ({
        ...item.data(),
        id: item.id,
      } as AnnouncementDoc))),
      (snapshotError) => {
        console.error('Instructor announcements subscription error:', snapshotError);
        setError('Unable to load announcements.');
      }
    );

    return () => {
      unsubscribeSubmissions();
      unsubscribeAnnouncements();
    };
  }, []);

  const publishAnnouncement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !content.trim() || !user) return;

    setSaving(true);
    setError(null);
    try {
      await addDoc(collection(db, 'announcements'), {
        title: title.trim(),
        content: content.trim(),
        author: learnerProfile?.learner_name || user.displayName || 'Instructor',
        authorId: user.uid,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setContent('');
    } catch (publishError) {
      console.error('Instructor announcement error:', publishError);
      setError('The announcement could not be published.');
    } finally {
      setSaving(false);
    }
  };

  const gradeSubmission = async (submission: ActivitySubmission) => {
    if (!submission.id) return;
    const score = Number(scores[submission.id]);
    if (!Number.isFinite(score) || score < 0) {
      setError('Enter a valid score of zero or higher.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'submissions', submission.id), {
        score,
        feedback: feedback[submission.id]?.trim() || '',
        status: 'graded',
      });
    } catch (gradeError) {
      console.error('Instructor grading error:', gradeError);
      setError('The submission could not be graded.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Instructor workspace</p>
        <h1 className="mt-2 text-2xl font-black">Learner submissions and announcements</h1>
        <p className="mt-2 text-sm text-slate-300">Review learner work and share announcements with AccessiLearn users.</p>
      </header>

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><Megaphone className="h-5 w-5 text-indigo-600" /> Publish an announcement</h2>
          <form onSubmit={publishAnnouncement} className="mt-4 space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Title
              <input required maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Message
              <textarea required maxLength={4000} rows={5} value={content} onChange={(event) => setContent(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">
              <Send className="h-4 w-4" /> {saving ? 'Publishing...' : 'Publish announcement'}
            </button>
          </form>
          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Recent announcements</h3>
            <ul className="mt-3 space-y-3">
              {announcements.slice(0, 4).map((announcement) => (
                <li key={announcement.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm font-bold text-slate-900">{announcement.title}</p>
                  <p className="mt-1 line-clamp-3 text-xs text-slate-600">{announcement.content}</p>
                  <p className="mt-2 text-[10px] text-slate-400">{announcement.author}</p>
                </li>
              ))}
              {announcements.length === 0 && <li className="text-xs text-slate-500">No announcements have been published.</li>}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><Users className="h-5 w-5 text-indigo-600" /> Learner submissions</h2>
              <p className="mt-1 text-xs text-slate-500">Live updates as learners submit or instructors grade work.</p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{submissions.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {submissions.map((submission) => (
              <article key={submission.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{submission.activity_title || 'Classroom assignment'}</h3>
                    <p className="mt-1 text-xs text-slate-500">{submission.learner_name} · {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'Submission date unavailable'}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">{submission.status}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{submission.response_text}</p>
                {submission.status === 'graded' ? (
                  <p className="mt-3 text-xs font-semibold text-emerald-700">Score: {submission.score ?? '—'}{submission.feedback ? ` · ${submission.feedback}` : ''}</p>
                ) : (
                  <form
                    className="mt-3 grid gap-2 sm:grid-cols-[7rem_1fr_auto]"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void gradeSubmission(submission);
                    }}
                  >
                    <label className="sr-only" htmlFor={`score-${submission.id}`}>Score</label>
                    <input
                      id={`score-${submission.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={scores[submission.id!] || ''}
                      onChange={(event) => setScores((current) => ({ ...current, [submission.id!]: event.target.value }))}
                      placeholder="Score"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                    <label className="sr-only" htmlFor={`feedback-${submission.id}`}>Feedback for learner</label>
                    <input
                      id={`feedback-${submission.id}`}
                      value={feedback[submission.id!] || ''}
                      onChange={(event) => setFeedback((current) => ({ ...current, [submission.id!]: event.target.value }))}
                      placeholder="Feedback for learner"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                    <button disabled={saving} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">Save grade</button>
                  </form>
                )}
              </article>
            ))}
            {submissions.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No learner submissions yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};
