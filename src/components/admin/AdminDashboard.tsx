import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LucideIcon,
  MessageSquare,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { UserAccount, LearnerProfile, Role, AnnouncementDoc, FeedbackRecord } from '../../types';

type AdminTab = 'overview' | 'users' | 'content' | 'classroom' | 'analytics' | 'accessibility' | 'support';

type UserFormState = { title: string; content: string };

type AssignableRole = Exclude<Role, 'admin'>;
type RoleOption = { value: AssignableRole; label: string; description: string };

const roleOptions: RoleOption[] = [
  { value: 'learner', label: 'Learner', description: 'Normal course participant' },
  { value: 'instructor', label: 'Instructor', description: 'Can manage classes and grades' },
  { value: 'researcher', label: 'Researcher', description: 'Can view analytics and evaluations' },
];

const emptyForm = { title: '', content: '' };

export const AdminDashboard: React.FC = () => {
  const { learnerProfile, user, logout, isAdmin, setAssignedRole } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementDoc[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [accessibilityAssessments, setAccessibilityAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');

  useEffect(() => {
    if (!user) return;

    const collections = [
      { ref: collection(db, 'users'), set: setUsers },
      { ref: query(collection(db, 'announcements'), orderBy('date', 'desc')), set: setAnnouncements },
      { ref: query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc')), set: setFeedback },
      { ref: query(collection(db, 'activities'), orderBy('due_date', 'asc')), set: setActivities },
      { ref: query(collection(db, 'submissions'), orderBy('submitted_at', 'desc')), set: setSubmissions },
      { ref: query(collection(db, 'user_experience_evaluations'), orderBy('createdAt', 'desc')), set: setEvaluations },
      { ref: query(collection(db, 'accessibility_assessments'), orderBy('createdAt', 'desc')), set: setAccessibilityAssessments },
    ];

    const unsubscribes = collections.map(({ ref, set }) => onSnapshot(ref, (snapshot) => {
      set(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) })));
    }, (snapshotError) => {
      console.error(snapshotError);
      setError('Unable to load the most recent administration data.');
    }));

    setLoading(false);
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [user]);

  const filteredUsers = useMemo(
    () => (roleFilter === 'all' ? users : users.filter((account) => account.role === roleFilter)),
    [roleFilter, users]
  );

  const totals = useMemo(() => ({
    users: users.length,
    online: users.filter((account) => account.isOnline).length,
    announcements: announcements.length,
    feedback: feedback.length,
    submissions: submissions.length,
    evaluations: evaluations.length,
    accessibilityIssues: accessibilityAssessments.filter((item) => item.accessibility_rating <= 2).length,
  }), [accessibilityAssessments, announcements, evaluations, feedback, submissions, users]);

  const stats: Array<{ label: string; value: number; caption: string; icon: LucideIcon }> = [
    { label: 'Users', value: totals.users, caption: 'Registered accounts', icon: Users },
    { label: 'Online', value: totals.online, caption: 'Current session', icon: Activity },
    { label: 'Announcements', value: totals.announcements, caption: 'Published', icon: FileText },
    { label: 'Feedback', value: totals.feedback, caption: 'Support records', icon: MessageSquare },
    { label: 'Submissions', value: totals.submissions, caption: 'Student work', icon: CheckCircle2 },
    { label: 'Evaluations', value: totals.evaluations, caption: 'Survey records', icon: BarChart3 },
    { label: 'Priority issues', value: totals.accessibilityIssues, caption: 'Accessibility risks', icon: XCircle },
  ];

  const handleRoleChange = async (targetUser: UserAccount, nextRole: AssignableRole) => {
    if (!targetUser.id || !user || !isAdmin) return;

    setSaving(true);
    setError(null);
    try {
      await setAssignedRole(targetUser.id, nextRole);
    } catch (updateError) {
      console.error(updateError);
      setError('The role could not be changed.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Add both a title and content before publishing.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await addDoc(collection(db, 'announcements'), {
        title: form.title.trim(),
        author: learnerProfile?.learner_name || user?.displayName || 'Administrator',
        authorId: user?.uid,
        date: new Date().toISOString(),
        content: form.content.trim(),
        createdAt: serverTimestamp(),
      });
      setForm(emptyForm);
    } catch (createError) {
      console.error(createError);
      setError('The announcement could not be published.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'announcements', announcementId));
    } catch (deleteError) {
      console.error(deleteError);
      setError('The announcement could not be deleted.');
    } finally {
      setSaving(false);
    }
  };

  const exportJSON = (data: unknown, filename: string) => {
    const anchor = document.createElement('a');
    anchor.href = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    anchor.download = `${filename}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const tabItems: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'content', label: 'Content', icon: BookOpen },
    { id: 'classroom', label: 'Classroom', icon: GraduationCap },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'accessibility', label: 'Accessibility', icon: ShieldCheck },
    { id: 'support', label: 'Support', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              <ShieldCheck className="h-4 w-4" /> Administrator panel
            </p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">AccessiLearn administration</h1>
            <p className="mt-2 text-sm text-slate-300">Signed in as {user?.email}. Keep learner data protected and review activity regularly.</p>
          </div>
          <button onClick={logout} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-100 hover:bg-slate-700">Sign out</button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {stats.map(({ label, value, caption, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Icon className="h-5 w-5 text-indigo-600" />
            <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
            <p className="text-xs font-bold text-slate-700">{label}</p>
            <p className="text-[10px] text-slate-500">{caption}</p>
          </div>
        ))}
      </div>

      <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="Administration sections">
        {tabItems.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${activeTab === id ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </nav>

      {loading ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Loading admin data...</div> : (
        <>
          {activeTab === 'overview' && (
            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-black text-slate-900">Platform activity</h2>
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Account records</span><strong>{totals.users}</strong></div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Student submissions</span><strong>{totals.submissions}</strong></div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Published announcements</span><strong>{totals.announcements}</strong></div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Feedback submissions</span><strong>{totals.feedback}</strong></div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between"><h2 className="text-sm font-black text-slate-900">Latest support feedback</h2><button onClick={() => setActiveTab('support')} className="text-xs font-bold text-indigo-600">View all</button></div>
                <div className="mt-4 space-y-3">
                  {feedback.slice(0, 3).map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-2"><strong className="text-xs text-slate-900">{item.learner_name}</strong><span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">{item.category}</span></div>
                      <p className="mt-2 text-xs text-slate-600">{item.feedback_text}</p>
                    </div>
                  ))}
                  {feedback.length === 0 && <p className="text-xs text-slate-500">No feedback has been submitted yet.</p>}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'users' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-black text-slate-900">User accounts and roles</h2>
                  <p className="text-xs text-slate-500">Role changes take effect immediately for signed-in users. Learners use course tools, instructors review and grade submissions and publish announcements, and researchers access evaluation analytics. Only the primary administrator manages roles.</p>
                </div>
                <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as 'all' | Role)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs"><option value="all">All roles</option>{roleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-600"><tr><th className="py-3 pr-4">User</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Role</th><th className="py-3 pr-4">Last active</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{filteredUsers.map((account) => (
                    <tr key={account.id}>
                      <td className="py-3 pr-4"><p className="font-bold text-slate-900">{account.learner_name || account.email}</p><p className="text-[10px] text-slate-500">{account.email}</p></td>
                      <td className="py-3 pr-4"><span className={`inline-flex rounded-full px-2 py-1 font-bold ${account.isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{account.isOnline ? 'Online' : 'Offline'}</span></td>
                      <td className="py-3 pr-4">{account.id === user?.uid ? <span className="rounded-lg bg-indigo-50 px-2 py-1.5 font-bold text-indigo-700">Primary administrator</span> : account.role === 'admin' ? <button disabled={saving} onClick={() => handleRoleChange(account, 'learner')} className="rounded-lg bg-amber-50 px-2 py-1.5 font-bold text-amber-800 disabled:opacity-60">Legacy admin · reset to learner</button> : <select disabled={saving} value={account.role || 'learner'} onChange={(event) => handleRoleChange(account, event.target.value as AssignableRole)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-bold text-slate-700"><option value="learner">Learner</option><option value="instructor">Instructor</option><option value="researcher">Researcher</option></select>}</td>
                      <td className="py-3 pr-4 text-slate-500">{account.lastSeenAt ? new Date(account.lastSeenAt).toLocaleString() : 'Never'}</td>
                    </tr>
                  ))}<tr>{filteredUsers.length === 0 && <td colSpan={4} className="py-8 text-center text-slate-500">No users match the selected role.</td>}</tr></tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'content' && (
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-black text-slate-900">Publish an announcement</h2>
                <div className="mt-4 space-y-3">
                  <label className="block text-[11px] font-bold text-slate-700">Title<input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="New course update" /></label>
                  <label className="block text-[11px] font-bold text-slate-700">Content<textarea value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} rows={6} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Share important information with learners." /></label>
                  <button disabled={saving} onClick={handleCreateAnnouncement} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-xs font-black text-white disabled:opacity-60">{saving ? 'Publishing...' : 'Publish announcement'}</button>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-black text-slate-900">Existing announcements</h2>
                <div className="mt-4 space-y-3">
                  {announcements.map((announcement) => (
                    <article key={announcement.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-900">{announcement.title}</h3><p className="mt-1 text-[10px] text-slate-500">{announcement.author} · {announcement.date ? new Date(announcement.date).toLocaleDateString() : 'Published'}</p></div><button onClick={() => handleDeleteAnnouncement(announcement.id)} className="rounded-lg bg-rose-50 p-2 text-rose-600 hover:bg-rose-100" aria-label={`Delete ${announcement.title}`}><Trash2 className="h-4 w-4" /></button></div>
                      <p className="mt-3 text-xs leading-6 text-slate-600">{announcement.content}</p>
                    </article>
                  ))}
                  {announcements.length === 0 && <p className="text-xs text-slate-500">No announcements have been published.</p>}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'classroom' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><h2 className="text-sm font-black text-slate-900">Classroom records</h2><button onClick={() => exportJSON({ activities, submissions }, 'classroom-records')} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold"><Download className="h-4 w-4" /> Export </button></div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Activities</p><p className="mt-2 text-2xl font-black text-slate-900">{activities.length}</p></div>
                <div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Submissions</p><p className="mt-2 text-2xl font-black text-slate-900">{submissions.length}</p></div>
              </div>
              <div className="mt-5 max-h-[480px] overflow-auto">
                <table className="w-full text-left text-xs"><thead className="border-b border-slate-200"><tr><th className="py-3 pr-4">Activity</th><th className="py-3 pr-4">Learner</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Score</th></tr></thead><tbody className="divide-y divide-slate-100">{submissions.map((submission) => <tr key={submission.id}><td className="py-3 pr-4 font-bold text-slate-900">{submission.activity_title}</td><td className="py-3 pr-4 text-slate-600">{submission.learner_name}</td><td className="py-3 pr-4"><span className={`rounded-full px-2 py-1 font-bold ${submission.status === 'graded' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{submission.status}</span></td><td className="py-3 pr-4 text-slate-600">{submission.score ?? '-'}</td></tr>)}{submissions.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-500">No learner submissions are available yet.</td></tr>}</tbody></table>
              </div>
            </section>
          )}

          {activeTab === 'analytics' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><h2 className="text-sm font-black text-slate-900">Research and evaluation analytics</h2><button onClick={() => exportJSON(evaluations, 'evaluation-analytics')} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold"><Download className="h-4 w-4" /> Export JSON</button></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
                ['Evaluations', evaluations.length], ['Mean score', evaluations.length ? (evaluations.reduce((sum, item) => sum + Number(item.overall_average || 0), 0) / evaluations.length).toFixed(2) : '0.00'], ['Responded', feedback.length], ['Completed activities', submissions.filter((submission) => submission.status === 'submitted').length],
              ].map(([label, value]) => <div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-900">{value}</p></div>)}</div>
              <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b border-slate-200"><tr><th className="py-3 pr-4">Learner</th><th className="py-3 pr-4">Need</th><th className="py-3 pr-4">Ease</th><th className="py-3 pr-4">Satisfaction</th><th className="py-3 pr-4">Average</th></tr></thead><tbody className="divide-y divide-slate-100">{evaluations.map((evaluation) => <tr key={evaluation.id}><td className="py-3 pr-4 font-bold text-slate-900">{evaluation.learner_name}</td><td className="py-3 pr-4 text-slate-600">{evaluation.educational_need}</td><td className="py-3 pr-4">{evaluation.ease_of_use}</td><td className="py-3 pr-4">{evaluation.satisfaction}</td><td className="py-3 pr-4 font-bold text-indigo-700">{evaluation.overall_average}</td></tr>)}{evaluations.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">No evaluation records are available yet.</td></tr>}</tbody></table></div>
            </section>
          )}

          {activeTab === 'accessibility' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><h2 className="text-sm font-black text-slate-900">Accessibility issue monitoring</h2><button onClick={() => exportJSON(accessibilityAssessments, 'accessibility-assessments')} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold"><Download className="h-4 w-4" /> Export </button></div>
              <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b border-slate-200"><tr><th className="py-3 pr-4">Feature</th><th className="py-3 pr-4">Learner</th><th className="py-3 pr-4">Rating</th><th className="py-3 pr-4">Helpful</th><th className="py-3 pr-4">Issue</th></tr></thead><tbody className="divide-y divide-slate-100">{accessibilityAssessments.map((assessment) => <tr key={assessment.id}><td className="py-3 pr-4 font-bold text-slate-900">{assessment.feature_name}</td><td className="py-3 pr-4 text-slate-600">{assessment.learner_name || 'Unknown learner'}</td><td className="py-3 pr-4"><span className={`rounded-full px-2 py-1 font-bold ${assessment.accessibility_rating <= 2 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{assessment.accessibility_rating}/5</span></td><td className="py-3 pr-4">{assessment.helpful ? 'Yes' : 'No'}</td><td className="py-3 pr-4 text-slate-600">{assessment.accessibility_issue || 'No issue reported'}</td></tr>)}{accessibilityAssessments.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">No accessibility assessments have been recorded.</td></tr>}</tbody></table></div>
            </section>
          )}

          {activeTab === 'support' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><h2 className="text-sm font-black text-slate-900">Learner support queue</h2><button onClick={() => exportJSON(feedback, 'support-feedback')} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold"><Download className="h-4 w-4" /> Export </button></div>
              <div className="mt-5 space-y-3">{feedback.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><div><strong className="text-sm text-slate-900">{item.learner_name}</strong><p className="text-[10px] text-slate-500">{item.category} · {item.educational_need || 'General'}</p></div><span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700">{item.category}</span></div><p className="mt-3 text-xs leading-6 text-slate-600"><strong className="text-slate-800">Feedback:</strong> {item.feedback_text}</p>{item.suggestion && <p className="mt-2 text-xs leading-6 text-emerald-700"><strong>Suggestion:</strong> {item.suggestion}</p>}</article>)}{feedback.length === 0 && <p className="text-xs text-slate-500">No learner support requests are currently open.</p>}</div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
