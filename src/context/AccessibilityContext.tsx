import React, { createContext, useContext, useEffect, useState } from 'react';

export type TextSize = 'normal' | 'large' | 'xlarge';
export type ContrastTheme = 'standard' | 'high-contrast-dark' | 'high-contrast-light' | 'yellow-on-black';

interface AccessibilityContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  contrastTheme: ContrastTheme;
  setContrastTheme: (theme: ContrastTheme) => void;
  dyslexicFont: boolean;
  setDyslexicFont: (val: boolean) => void;
  showAltInspector: boolean;
  setShowAltInspector: (val: boolean) => void;
  readingRuler: boolean;
  setReadingRuler: (val: boolean) => void;
  captionsEnabled: boolean;
  setCaptionsEnabled: (val: boolean) => void;
  isSpeaking: boolean;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  announce: (message: string) => void;
  announcement: string;
  resetToDefaults: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textSize, setTextSize] = useState<TextSize>('normal');
  const [contrastTheme, setContrastTheme] = useState<ContrastTheme>('standard');
  const [dyslexicFont, setDyslexicFont] = useState<boolean>(false);
  const [showAltInspector, setShowAltInspector] = useState<boolean>(false);
  const [readingRuler, setReadingRuler] = useState<boolean>(false);
  const [captionsEnabled, setCaptionsEnabled] = useState<boolean>(true);
  const [announcement, setAnnouncement] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const announce = (message: string) => {
    setAnnouncement(message);
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      announce('Speech synthesis is not supported on this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Slightly slower for better comprehension
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    announce(`Reading aloud: ${text.slice(0, 40)}...`);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    announce('Speech stopped.');
  };

  const resetToDefaults = () => {
    setTextSize('normal');
    setContrastTheme('standard');
    setDyslexicFont(false);
    setShowAltInspector(false);
    setReadingRuler(false);
    setCaptionsEnabled(true);
    stopSpeaking();
    announce('Accessibility settings reset to default.');
  };

  // Sync classes to HTML body for global styling
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove prior contrast classes
    root.classList.remove('theme-high-contrast-dark', 'theme-high-contrast-light', 'theme-yellow-on-black');
    if (contrastTheme !== 'standard') {
      root.classList.add(`theme-${contrastTheme}`);
    }

    // Text size classes
    root.classList.remove('text-size-large', 'text-size-xlarge');
    if (textSize === 'large') root.classList.add('text-size-large');
    if (textSize === 'xlarge') root.classList.add('text-size-xlarge');

    // Dyslexic font class
    if (dyslexicFont) {
      root.classList.add('font-dyslexic');
    } else {
      root.classList.remove('font-dyslexic');
    }
  }, [textSize, contrastTheme, dyslexicFont]);

  return (
    <AccessibilityContext.Provider
      value={{
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
        announce,
        announcement,
        resetToDefaults,
      }}
    >
      {/* Screen Reader ARIA Live Region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="a11y-announcer"
      >
        {announcement}
      </div>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
