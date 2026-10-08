import React from 'react';
import {
  X,
  Type,
  Sun,
  Moon,
  Zap,
  Volume2,
  VolumeX,
  Bookmark,
  Eye,
  Subtitles,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { ContrastTheme, TextSize, useAccessibility } from '../../context/AccessibilityContext';

interface AccessibilitySectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilitySection: React.FC<AccessibilitySectionProps> = ({ isOpen, onClose }) => {
  const {
    textSize,
    setTextSize,
    contrastTheme,
    setContrastTheme,
    dyslexicFont,
    setDyslexicFont,
    showAltInspector,
    setShowAltInspector,
    readingRuler,
    setReadingRuler,
    captionsEnabled,
    setCaptionsEnabled,
    isSpeaking,
    speakText,
    stopSpeaking,
    resetToDefaults,
    announce,
  } = useAccessibility();

  if (!isOpen) return null;

  const handleReadAloud = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const mainEl = document.getElementById('main-content');
      if (mainEl) {
        speakText(mainEl.innerText.slice(0, 600));
      } else {
        speakText('Accessibility settings panel open.');
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-section-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Panel Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 text-white" />
            </div>
            <h2 id="a11y-section-title" className="text-lg font-bold">
              Accessibility Settings & Special Features
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-white"
            aria-label="Close accessibility settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Panel Controls */}
        <div className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
          
          {/* 1. Text Sizing */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Type className="w-4 h-4 text-indigo-600" />
                <span>Text Size</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-500">
                {textSize === 'normal' ? '100%' : textSize === 'large' ? '115%' : '130%'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTextSize('normal');
                  announce('Text size set to standard 100%');
                }}
                className={`py-2 px-3 rounded-xl font-bold transition-all ${
                  textSize === 'normal'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                100% Standard
              </button>
              <button
                type="button"
                onClick={() => {
                  setTextSize('large');
                  announce('Text size set to large 115%');
                }}
                className={`py-2 px-3 rounded-xl font-bold transition-all ${
                  textSize === 'large'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                115% Large
              </button>
              <button
                type="button"
                onClick={() => {
                  setTextSize('xlarge');
                  announce('Text size set to extra large 130%');
                }}
                className={`py-2 px-3 rounded-xl font-bold transition-all ${
                  textSize === 'xlarge'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                130% Extra Large
              </button>
            </div>
          </div>

          {/* 2. High Contrast Theme */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <label className="font-bold text-slate-900 text-xs block">
              Color Contrast Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setContrastTheme('standard')}
                className={`p-2.5 rounded-xl text-center font-bold flex flex-col items-center gap-1.5 transition-all ${
                  contrastTheme === 'standard'
                    ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Standard</span>
              </button>

              <button
                type="button"
                onClick={() => setContrastTheme('high-contrast-dark')}
                className={`p-2.5 rounded-xl text-center font-bold flex flex-col items-center gap-1.5 transition-all ${
                  contrastTheme === 'high-contrast-dark'
                    ? 'bg-slate-950 text-white ring-2 ring-white shadow-xs'
                    : 'bg-slate-900 text-slate-100 hover:bg-black'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark High-Contrast</span>
              </button>

              <button
                type="button"
                onClick={() => setContrastTheme('high-contrast-light')}
                className={`p-2.5 rounded-xl text-center font-bold flex flex-col items-center gap-1.5 transition-all ${
                  contrastTheme === 'high-contrast-light'
                    ? 'bg-white text-black ring-2 ring-black font-black'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Light High-Contrast</span>
              </button>

              <button
                type="button"
                onClick={() => setContrastTheme('yellow-on-black')}
                className={`p-2.5 rounded-xl text-center font-bold flex flex-col items-center gap-1.5 transition-all ${
                  contrastTheme === 'yellow-on-black'
                    ? 'bg-black text-yellow-300 ring-2 ring-yellow-400'
                    : 'bg-black text-yellow-400 hover:bg-slate-950'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Yellow on Black</span>
              </button>
            </div>
          </div>

          {/* 3. Special Assistive Features (Toggles) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <label className="font-bold text-slate-900 text-xs block">
              Special Features
            </label>

            <div className="space-y-2.5">
              {/* Focus Reading Ruler */}
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-500" />
                  <div>
                    <strong className="text-slate-900 block text-xs">Focus Reading Ruler</strong>
                    <span className="text-[11px] text-slate-500">Horizontal tracking guide for reading</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReadingRuler(!readingRuler);
                    announce(`Reading ruler ${!readingRuler ? 'turned on' : 'turned off'}`);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                    readingRuler
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                  }`}
                  aria-pressed={readingRuler}
                >
                  {readingRuler ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Dyslexia Typography */}
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <div>
                    <strong className="text-slate-900 block text-xs">Dyslexia Font & Spacing</strong>
                    <span className="text-[11px] text-slate-500">Enhanced letter and word spacing</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDyslexicFont(!dyslexicFont);
                    announce(`Dyslexia font ${!dyslexicFont ? 'turned on' : 'turned off'}`);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                    dyslexicFont
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                  }`}
                  aria-pressed={dyslexicFont}
                >
                  {dyslexicFont ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Alt-Text Inspector */}
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <div>
                    <strong className="text-slate-900 block text-xs">Alt-Text Tag Inspector</strong>
                    <span className="text-[11px] text-slate-500">Displays text descriptions on diagrams</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAltInspector(!showAltInspector);
                    announce(`Alt text inspector ${!showAltInspector ? 'turned on' : 'turned off'}`);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                    showAltInspector
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                  }`}
                  aria-pressed={showAltInspector}
                >
                  {showAltInspector ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Closed Captions */}
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <Subtitles className="w-4 h-4 text-purple-600" />
                  <div>
                    <strong className="text-slate-900 block text-xs">Video Subtitles & Captions</strong>
                    <span className="text-[11px] text-slate-500">Synchronized text overlay on videos</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCaptionsEnabled(!captionsEnabled);
                    announce(`Captions ${!captionsEnabled ? 'turned on' : 'turned off'}`);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                    captionsEnabled
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                  }`}
                  aria-pressed={captionsEnabled}
                >
                  {captionsEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>

          {/* 4. Speech Narration */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-600" />
              <div>
                <strong className="text-slate-900 block text-xs">Read Page Aloud (TTS)</strong>
                <span className="text-[11px] text-slate-500">Web Speech API audio synthesizer</span>
              </div>
            </div>

            {isSpeaking ? (
              <button
                type="button"
                onClick={stopSpeaking}
                className="px-3.5 py-1.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 flex items-center gap-1.5 animate-pulse"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReadAloud}
                className="px-3.5 py-1.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Play</span>
              </button>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={resetToDefaults}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
