import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Subtitles,
  FileText,
  Download,
  Info,
  ChevronRight,
  Maximize2,
  CheckCircle,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { VIDEO_TRANSCRIPT_DATA } from '../../data/initialData';

export const LearningMaterialsViewer: React.FC = () => {
  const {
    showAltInspector,
    captionsEnabled,
    setCaptionsEnabled,
    speakText,
    stopSpeaking,
    isSpeaking,
    announce,
  } = useAccessibility();

  // Video player simulation state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeSubtitle, setActiveSubtitle] = useState<string>('Welcome to this introductory session on Web Accessibility and Universal Design for Learning.');
  const [activeUnit, setActiveUnit] = useState<number>(1);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Interval for simulated video progress
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1;
          if (next >= 100) {
            setIsPlaying(false);
            return 0;
          }
          // Update active subtitle based on time seconds
          if (next < 18) {
            setActiveSubtitle(VIDEO_TRANSCRIPT_DATA[0].text);
          } else if (next < 35) {
            setActiveSubtitle(VIDEO_TRANSCRIPT_DATA[1].text);
          } else if (next < 55) {
            setActiveSubtitle(VIDEO_TRANSCRIPT_DATA[2].text);
          } else if (next < 75) {
            setActiveSubtitle(VIDEO_TRANSCRIPT_DATA[3].text);
          } else if (next < 95) {
            setActiveSubtitle(VIDEO_TRANSCRIPT_DATA[4].text);
          } else {
            setActiveSubtitle(VIDEO_TRANSCRIPT_DATA[5].text);
          }
          return next;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  const toggleVideoPlay = () => {
    setIsPlaying(!isPlaying);
    announce(isPlaying ? 'Video paused' : 'Video playing with captions');
  };

  const jumpToTimestamp = (seconds: number, caption: string) => {
    setCurrentTime(seconds);
    setActiveSubtitle(caption);
    setIsPlaying(true);
    announce(`Jumped to ${seconds} seconds: ${caption}`);
  };

  const downloadTranscript = () => {
    const textContent = VIDEO_TRANSCRIPT_DATA.map(t => `[${t.time}] ${t.text}`).join('\n\n');
    const blob = new Blob([`ACCESSILEARN COURSE TRANSCRIPT\nInstitute of Information and Computing Technology\n\n${textContent}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accessible_course_transcript.txt';
    a.click();
    announce('Accessible transcript downloaded as plain text.');
  };

  return (
    <div className="space-y-6">
      
      {/* Breadcrumb Navigation (A5) */}
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
        <span>Courses</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span>IT 301: Human Computer Interaction & SEN Inclusion</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-indigo-600 font-bold" aria-current="page">
          Module 1: Foundations of Accessible Digital Learning
        </span>
      </nav>

      {/* Module Overview Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Module 1: Foundations of Accessible Digital Learning
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking();
                } else {
                  speakText(
                    'Module 1: Foundations of Accessible Digital Learning. Republic Act 11650 establishes the right of Filipino learners with disabilities to accessible education.'
                  );
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-semibold text-xs focus:ring-2 focus:ring-indigo-500"
              aria-label="Read module introduction aloud"
            >
              {isSpeaking ? <VolumeX className="w-4 h-4 text-rose-600" /> : <Volume2 className="w-4 h-4 text-indigo-600" />}
              <span>{isSpeaking ? 'Stop Speech' : 'Read Aloud'}</span>
            </button>
          </div>
        </div>

        {/* Unit Tabs */}
        <div className="pt-2 flex flex-wrap gap-2 border-t border-slate-100" role="tablist">
          <button
            role="tab"
            aria-selected={activeUnit === 1}
            onClick={() => setActiveUnit(1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeUnit === 1
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Unit 1: Lesson Text
          </button>
          <button
            role="tab"
            aria-selected={activeUnit === 2}
            onClick={() => setActiveUnit(2)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeUnit === 2
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Unit 2: Diagram & Alt Text
          </button>
          <button
            role="tab"
            aria-selected={activeUnit === 3}
            onClick={() => setActiveUnit(3)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeUnit === 3
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Unit 3: Video Lecture & Captions
          </button>
        </div>
      </div>

      {/* UNIT 1: Text Reading Content */}
      {activeUnit === 1 && (
        <article className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <header className="border-b border-slate-200 pb-3">
            <h2 className="text-xl font-bold text-slate-900">
              1. Philippine Inclusive Education Policy & UDL Framework
            </h2>
          </header>

          <section className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <h3 className="text-base font-bold text-slate-900">
              1.1 Republic Act No. 11650 (2022) Mandates
            </h3>
            <p>
              Republic Act No. 11650, officially titled the <em>Instituting a Policy of Inclusion and Services for Learners with Disabilities in Support of Inclusive Education Act</em>, establishes the right of Filipino learners with disabilities to accessible, equitable, and quality education.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-xl">
              <p className="text-blue-900 font-medium text-xs">
                <strong>Statutory Requirement:</strong> Educational institutions are mandated to provide reasonable accommodation, accessible instructional materials, and assistive devices to ensure no learner is marginalized by digital barriers.
              </p>
            </div>

            <h3 className="text-base font-bold text-slate-900 pt-2">
              1.2 The Three Universal Design for Learning (UDL) Pillars
            </h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Multiple Means of Representation:</strong> Delivering knowledge via text, audio narration, tactile elements, and video with synchronized captions.
              </li>
              <li>
                <strong>Multiple Means of Action and Expression:</strong> Permitting students to submit assignments through typing, keyboard-only controls, voice transcription, or structured lists.
              </li>
              <li>
                <strong>Multiple Means of Engagement:</strong> Providing high contrast modes, focus rulers, and adjustable typography to accommodate diverse sensory thresholds.
              </li>
            </ul>
          </section>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setActiveUnit(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              <span>Next Unit</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </article>
      )}

      {/* UNIT 2: Instructional Images with Alt Text */}
      {activeUnit === 2 && (
        <article className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <header className="border-b border-slate-200 pb-3">
            <h2 className="text-xl font-bold text-slate-900">
              2. Architectural Diagram: Input - Process - Output Flow
            </h2>
          </header>

          {/* Diagram 1: Conceptual Framework IPO Model */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="relative bg-white border border-indigo-200 rounded-xl p-6 shadow-xs text-center space-y-4">
              
              {/* Graphic Representation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-left">
                  <span className="font-bold text-indigo-900 text-xs block mb-1">INPUT</span>
                  <ul className="text-[11px] text-slate-700 space-y-1 list-disc pl-4">
                    <li>Learners' Experiences</li>
                    <li>Accessibility Needs</li>
                    <li>LMS Features</li>
                    <li>Problems Encountered</li>
                  </ul>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
                  <span className="font-bold text-amber-900 text-xs block mb-1">PROCESS</span>
                  <ul className="text-[11px] text-slate-700 space-y-1 list-disc pl-4">
                    <li>Data Gathering</li>
                    <li>Problem Identification</li>
                    <li>LMS Evaluation</li>
                    <li>Agile Iteration</li>
                  </ul>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-left">
                  <span className="font-bold text-emerald-900 text-xs block mb-1">OUTPUT</span>
                  <ul className="text-[11px] text-slate-700 space-y-1 list-disc pl-4">
                    <li>Identified Issues</li>
                    <li>UX Ratings</li>
                    <li>Recommendations</li>
                  </ul>
                </div>
              </div>

              {/* Alt Text Inspector Tag */}
              <div className={`text-left p-3 rounded-lg border text-xs transition-all ${
                showAltInspector
                  ? 'bg-amber-100 text-amber-950 border-amber-400 font-medium ring-2 ring-amber-400'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}>
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Eye className="w-4 h-4 text-amber-700" />
                  <span>Alternative Text:</span>
                </div>
                <p className="italic font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
                  "Conceptual Framework flowchart for LMS study. Input: experiences, needs, features, feedback. Process: evaluation through data gathering and problem identification. Output: identified issues, ratings, and recommendations."
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between">
            <button
              onClick={() => setActiveUnit(1)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
            >
              Previous Unit
            </button>
            <button
              onClick={() => setActiveUnit(3)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              <span>Next Unit</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </article>
      )}

      {/* UNIT 3: Captioned Video Player */}
      {activeUnit === 3 && (
        <article className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <header className="border-b border-slate-200 pb-3">
            <h2 className="text-xl font-bold text-slate-900">
              3. Video Lecture with Captions & Interactive Transcript
            </h2>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Video Player Box */}
            <div className="lg:col-span-7 space-y-3">
              <div
                className="relative bg-slate-950 aspect-video rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between p-4 border border-slate-800"
                aria-label="Instructional Video Player"
              >
                {/* Visual Content */}
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-600/30 border border-indigo-400 flex items-center justify-center text-indigo-300 mb-2">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h4 className="text-white font-bold text-sm">
                    Lecture: Designing Inclusive E-Learning Platforms
                  </h4>
                </div>

                {/* Subtitle / Closed Caption */}
                {captionsEnabled && (
                  <div className="bg-black/90 text-yellow-300 px-4 py-2 rounded-xl text-center font-medium text-xs sm:text-sm mx-auto max-w-[90%] border border-yellow-400/30 shadow-md">
                    {activeSubtitle}
                  </div>
                )}

                {/* Video Controls Bar */}
                <div className="bg-slate-900/90 backdrop-blur-xs p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-white">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleVideoPlay}
                      className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white focus:outline-none focus:ring-2 focus:ring-white"
                      aria-label={isPlaying ? 'Pause video' : 'Play video'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <span className="text-xs font-mono text-slate-300">
                      0:{currentTime.toString().padStart(2, '0')} / 1:40
                    </span>
                  </div>

                  {/* Captions Toggle & Speed */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCaptionsEnabled(!captionsEnabled);
                        announce(`Captions ${!captionsEnabled ? 'enabled' : 'disabled'}`);
                      }}
                      className={`p-1.5 px-2.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 ${
                        captionsEnabled
                          ? 'bg-amber-400 text-slate-950 border-amber-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                      aria-label="Toggle Closed Captions"
                      aria-pressed={captionsEnabled}
                    >
                      <Subtitles className="w-3.5 h-3.5" />
                      <span>CC</span>
                    </button>

                    <select
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                      className="bg-slate-800 text-white text-xs rounded-lg px-2 py-1 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      aria-label="Playback speed"
                    >
                      <option value={0.75}>0.75x</option>
                      <option value={1}>1.0x</option>
                      <option value={1.25}>1.25x</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Download Transcript Button */}
              <div className="flex items-center justify-end text-xs">
                <button
                  onClick={downloadTranscript}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Transcript (.txt)</span>
                </button>
              </div>
            </div>

            {/* Right: Interactive Transcript */}
            <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col h-[380px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Transcript
                </h3>
                <span className="text-[10px] text-slate-500">Click to jump</span>
              </div>

              <div className="flex-1 overflow-y-auto pt-2 space-y-2 pr-1" tabIndex={0} aria-label="Course Video Transcript Lines">
                {VIDEO_TRANSCRIPT_DATA.map((item, idx) => {
                  const isCurrent = activeSubtitle === item.text;
                  const timeSeconds = idx * 19;
                  return (
                    <button
                      key={idx}
                      onClick={() => jumpToTimestamp(timeSeconds, item.text)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isCurrent
                          ? 'bg-amber-100 border-amber-400 text-slate-950 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded text-[10px] mr-2">
                        {item.time}
                      </span>
                      <span>{item.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between">
            <button
              onClick={() => setActiveUnit(2)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
            >
              Previous Unit
            </button>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Completed
            </span>
          </div>
        </article>
      )}

    </div>
  );
};
