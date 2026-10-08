import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Users,
  CheckCircle2,
  Sparkles,
  ClipboardList,
  Filter,
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserExperienceEvaluationRecord } from '../../types';

export const ResearcherDashboard: React.FC = () => {
  const [evaluations, setEvaluations] = useState<UserExperienceEvaluationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilterNeed, setActiveFilterNeed] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'analytics' | 'participants'>('analytics');

  // Real-time Firestore listener for UX Evaluations
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'user_experience_evaluations'),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: UserExperienceEvaluationRecord[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...(doc.data() as UserExperienceEvaluationRecord) });
          });
          setEvaluations(list);
          setLoading(false);
        },
        (err) => {
          console.warn('Error fetching evaluations from Firestore:', err);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Query error:', e);
      setLoading(false);
    }
  }, []);

  // Filtered dataset
  const filteredData =
    activeFilterNeed === 'all'
      ? evaluations
      : evaluations.filter((e) => e.educational_need === activeFilterNeed);

  const count = filteredData.length;
  const meanEase = count > 0 ? (filteredData.reduce((a, b) => a + (b.ease_of_use || 0), 0) / count).toFixed(2) : '0.00';
  const meanClarity = count > 0 ? (filteredData.reduce((a, b) => a + (b.clarity_understanding || 0), 0) / count).toFixed(2) : '0.00';
  const meanNav = count > 0 ? (filteredData.reduce((a, b) => a + (b.navigation || 0), 0) / count).toFixed(2) : '0.00';
  const meanConv = count > 0 ? (filteredData.reduce((a, b) => a + (b.convenience || 0), 0) / count).toFixed(2) : '0.00';
  const meanSat = count > 0 ? (filteredData.reduce((a, b) => a + (b.satisfaction || 0), 0) / count).toFixed(2) : '0.00';
  const grandMean =
    count > 0
      ? (
          (Number(meanEase) + Number(meanClarity) + Number(meanNav) + Number(meanConv) + Number(meanSat)) /
          5
        ).toFixed(2)
      : '0.00';

  const getLikertInterpretation = (val: number) => {
    if (val >= 4.2) return 'Strongly Agree (Highly Acceptable)';
    if (val >= 3.4) return 'Agree (Acceptable)';
    if (val >= 2.6) return 'Neutral (Moderate)';
    if (val >= 1.8) return 'Disagree (Poor)';
    if (val > 0) return 'Strongly Disagree (Unacceptable)';
    return 'No data';
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(evaluations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `evaluations_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Research & Evaluation Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time survey evaluations recorded in Firestore ({evaluations.length} total)
          </p>
        </div>

        {evaluations.length > 0 && (
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export JSON</span>
          </button>
        )}
      </div>

      {/* Cohort Need Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>Filter by Need:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'All Cohorts' },
            { id: 'Visual Impairment', label: 'Visual' },
            { id: 'Hearing Impairment', label: 'Hearing' },
            { id: 'Motor Impairment', label: 'Motor' },
            { id: 'Cognitive / Dyslexia', label: 'Cognitive' },
            { id: 'Low Vision / Color Blindness', label: 'Low Vision' },
            { id: 'General / Control Group', label: 'Control' },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveFilterNeed(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilterNeed === c.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          Loading analytics from database...
        </div>
      ) : count === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">No evaluations in the database yet</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            When learners complete the post-experience evaluation survey, their ratings across Ease of Use, Clarity, Navigation, Convenience, and Satisfaction will appear here in real time.
          </p>
        </div>
      ) : (
        <>
          {/* Dimension Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Ease of Use
              </span>
              <p className="text-2xl font-black text-indigo-600">{meanEase}</p>
              <span className="text-[10px] text-slate-500 block">/ 5.0</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Clarity
              </span>
              <p className="text-2xl font-black text-indigo-600">{meanClarity}</p>
              <span className="text-[10px] text-slate-500 block">/ 5.0</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Navigation
              </span>
              <p className="text-2xl font-black text-indigo-600">{meanNav}</p>
              <span className="text-[10px] text-slate-500 block">/ 5.0</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Convenience
              </span>
              <p className="text-2xl font-black text-indigo-600">{meanConv}</p>
              <span className="text-[10px] text-slate-500 block">/ 5.0</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Satisfaction
              </span>
              <p className="text-2xl font-black text-amber-600">{meanSat}</p>
              <span className="text-[10px] text-slate-500 block">/ 5.0</span>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl shadow-xs text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block">
                Grand Mean
              </span>
              <p className="text-2xl font-black text-indigo-900">{grandMean}</p>
              <span className="text-[10px] font-bold text-indigo-700 block">Overall Score</span>
            </div>
          </div>

          {/* Statistical Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm">
                Dimension Breakdown (N={count} Participants)
              </h2>
              <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                {getLikertInterpretation(Number(grandMean))}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" aria-label="Evaluation summary table">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                  <tr>
                    <th scope="col" className="px-5 py-3">Dimension</th>
                    <th scope="col" className="px-5 py-3">Mean Rating</th>
                    <th scope="col" className="px-5 py-3">Verbal Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-5 py-3.5 font-bold text-slate-900">1. Ease of Use</td>
                    <td className="px-5 py-3.5 font-extrabold text-indigo-700">{meanEase}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">{getLikertInterpretation(Number(meanEase))}</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3.5 font-bold text-slate-900">2. Clarity & Understanding</td>
                    <td className="px-5 py-3.5 font-extrabold text-indigo-700">{meanClarity}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">{getLikertInterpretation(Number(meanClarity))}</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3.5 font-bold text-slate-900">3. Navigation</td>
                    <td className="px-5 py-3.5 font-extrabold text-indigo-700">{meanNav}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">{getLikertInterpretation(Number(meanNav))}</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3.5 font-bold text-slate-900">4. Convenience</td>
                    <td className="px-5 py-3.5 font-extrabold text-indigo-700">{meanConv}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">{getLikertInterpretation(Number(meanConv))}</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3.5 font-bold text-slate-900">5. Overall Satisfaction</td>
                    <td className="px-5 py-3.5 font-extrabold text-amber-700">{meanSat}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">{getLikertInterpretation(Number(meanSat))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Participant Responses List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Recorded Evaluation Submissions
            </h3>

            <div className="divide-y divide-slate-100">
              {filteredData.map((record, i) => (
                <div key={record.id || i} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900">{record.learner_name}</strong>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                        {record.educational_need}
                      </span>
                    </div>
                    {record.problems_encountered && (
                      <p className="text-slate-600 text-xs">
                        <span className="font-semibold text-slate-700">Issue:</span> {record.problems_encountered}
                      </p>
                    )}
                    {record.suggestions && (
                      <p className="text-indigo-800 text-xs font-medium">
                        <span className="font-semibold text-indigo-950">Suggestion:</span> {record.suggestions}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      Average: {record.overall_average} / 5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
