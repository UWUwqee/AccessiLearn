import React, { useState } from 'react';
import {
  Eye,
  Type,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Bookmark,
  Sun,
  Moon,
  Zap,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ContrastTheme, TextSize, useAccessibility } from '../../context/AccessibilityContext';

export const AccessibilityToolbar: React.FC = () => {
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

  const [isOpen, setIsOpen] = useState(false);

  const handleTextSizeChange = (size: TextSize) => {
    setTextSize(size);
    announce(`Text size changed to ${size === 'normal' ? 'Standard 100%' : size === 'large' ? 'Large 115%' : 'Extra Large 130%'}`);
  };

  const handleContrastChange = (theme: ContrastTheme) => {
    setContrastTheme(theme);
    const names = {
      standard: 'Standard Theme',
      'high-contrast-dark': 'High Contrast Dark (WCAG AAA)',
      'high-contrast-light': 'High Contrast Light (WCAG AAA)',
      'yellow-on-black': 'High Contrast Yellow on Black (Low Vision Mode)',
    };
    announce(`Contrast mode updated to ${names[theme]}`);
  };

  const readActivePageSummary = () => {
    const mainEl = document.getElementById('main-content');
    if (mainEl) {
      const textToRead = mainEl.innerText.slice(0, 500);
      speakText(textToRead);
    } else {
      speakText('Welcome to AccessiLearn LMS prototype. Use Tab to navigate through sections.');
    }
  };

  return (
    <aside
      aria-label="Accessibility & Assistive Technology Quick Controls"
      className="sticky top-0 z-50 border-b border-indigo-200 bg-white/95 backdrop-blur-md shadow-sm transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between py-2 gap-2">
          {/* Main Indicator & Quick Badges */}
          <div className="flex items-center space-x-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-900 border border-indigo-300">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-700" aria-hidden="true" />
              <span>Accessibility</span>
            </span>

            {/* Read Aloud Voice Button */}
            {isSpeaking ? (
              <button
                onClick={stopSpeaking}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-rose-600 text-white rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm animate-pulse"
                aria-label="Stop reading aloud"
              >
                <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={readActivePageSummary}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                aria-label="Read active page summary aloud with speech synthesizer"
              >
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Read Page (TTS)</span>
              </button>
            )}

            {/* Reading Ruler Toggle */}
            <button
              onClick={() => {
                setReadingRuler(!readingRuler);
                announce(`Reading focus ruler ${!readingRuler ? 'activated' : 'deactivated'}`);
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
                readingRuler
                  ? 'bg-amber-400 text-slate-900 font-bold border-amber-600 shadow-inner'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              aria-pressed={readingRuler}
              aria-label="Toggle Reading Ruler focus guide"
            >
              <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Ruler {readingRuler ? 'ON' : 'OFF'}</span>
            </button>

            {/* Alt-Text Inspector Toggle */}
            <button
              onClick={() => {
                setShowAltInspector(!showAltInspector);
                announce(`Alt Text Inspector ${!showAltInspector ? 'enabled' : 'disabled'}`);
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
                showAltInspector
                  ? 'bg-emerald-600 text-white font-bold border-emerald-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              aria-pressed={showAltInspector}
              aria-label="Toggle Alt Text Inspector overlay on instructional images"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Alt Tags {showAltInspector ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Quick Font Size & Contrast Buttons */}
          <div className="flex items-center gap-2">
            {/* Font Sizer */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300" role="group" aria-label="Text Size Controls">
              <span className="px-2 text-xs font-medium text-slate-600 flex items-center gap-1">
                <Type className="w-3 h-3" aria-hidden="true" /> Text:
              </span>
              <button
                onClick={() => handleTextSizeChange('normal')}
                className={`px-2 py-0.5 text-xs font-bold rounded ${textSize === 'normal' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'}`}
                aria-pressed={textSize === 'normal'}
                title="Default size 100%"
              >
                100%
              </button>
              <button
                onClick={() => handleTextSizeChange('large')}
                className={`px-2 py-0.5 text-xs font-bold rounded ${textSize === 'large' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'}`}
                aria-pressed={textSize === 'large'}
                title="Large size 115%"
              >
                115%
              </button>
              <button
                onClick={() => handleTextSizeChange('xlarge')}
                className={`px-2 py-0.5 text-xs font-bold rounded ${textSize === 'xlarge' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'}`}
                aria-pressed={textSize === 'xlarge'}
                title="Extra large size 130%"
              >
                130%
              </button>
            </div>

            {/* Quick Contrast Modes */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300" role="group" aria-label="High Contrast Color Schemes">
              <span className="px-2 text-xs font-medium text-slate-600">Theme:</span>
              <button
                onClick={() => handleContrastChange('standard')}
                className={`px-2 py-0.5 text-xs font-semibold rounded flex items-center gap-1 ${contrastTheme === 'standard' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-200'}`}
                aria-pressed={contrastTheme === 'standard'}
                title="Default clean view"
              >
                <Sun className="w-3 h-3" /> Standard
              </button>
              <button
                onClick={() => handleContrastChange('high-contrast-dark')}
                className={`px-2 py-0.5 text-xs font-semibold rounded flex items-center gap-1 ${contrastTheme === 'high-contrast-dark' ? 'bg-slate-900 text-white ring-1 ring-white' : 'text-slate-700 hover:bg-slate-200'}`}
                aria-pressed={contrastTheme === 'high-contrast-dark'}
                title="High Contrast Dark Mode"
              >
                <Moon className="w-3 h-3" /> Dark
              </button>
              <button
                onClick={() => handleContrastChange('yellow-on-black')}
                className={`px-2 py-0.5 text-xs font-semibold rounded flex items-center gap-1 ${contrastTheme === 'yellow-on-black' ? 'bg-black text-yellow-300 ring-1 ring-yellow-400' : 'text-slate-700 hover:bg-slate-200'}`}
                aria-pressed={contrastTheme === 'yellow-on-black'}
                title="Yellow on Black High Contrast for Low Vision"
              >
                <Zap className="w-3 h-3 text-amber-500" /> Yellow/Black
              </button>
            </div>

            {/* Toggle Full Settings Panel */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              aria-expanded={isOpen}
              aria-controls="accessibility-drawer"
            >
              <span>More</span>
              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expanded Accessibility Settings Drawer */}
        {isOpen && (
          <div
            id="accessibility-drawer"
            className="pt-3 pb-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {/* Cognitive & Typography Options */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Dyslexia Font
              </h4>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dyslexicFont}
                  onChange={(e) => {
                    setDyslexicFont(e.target.checked);
                    announce(`Dyslexia typography ${e.target.checked ? 'enabled' : 'disabled'}`);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Enhanced Spacing Font</span>
              </label>
            </div>

            {/* Media & Closed Captions */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                Captions
              </h4>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={captionsEnabled}
                  onChange={(e) => {
                    setCaptionsEnabled(e.target.checked);
                    announce(`Closed captions ${e.target.checked ? 'enabled' : 'disabled'}`);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Video Subtitles & Transcript</span>
              </label>
            </div>

            {/* Reset */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-slate-900">Reset Settings</h4>
              <button
                onClick={resetToDefaults}
                className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
