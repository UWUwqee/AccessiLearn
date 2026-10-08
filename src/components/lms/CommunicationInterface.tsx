import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  User,
  GraduationCap,
  Volume2,
  HelpCircle,
  Sparkles,
  CheckCheck,
} from 'lucide-react';
import { addDoc, collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { DirectMessage } from '../../types';

export const CommunicationInterface: React.FC = () => {
  const { learnerProfile } = useAuth();
  const { speakText, announce } = useAccessibility();

  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Subscribe to messages in Firestore
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'messages'),
        orderBy('createdAt', 'asc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: DirectMessage[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...(doc.data() as DirectMessage) });
          });
          setMessages(list);
          setLoading(false);
        },
        (err) => {
          console.warn('Messages listener error:', err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Setting up messages:', e);
      setLoading(false);
    }
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSending(true);
    const newMsg: DirectMessage = {
      sender_id: learnerProfile?.id || 'demo_learner',
      sender_name: learnerProfile?.learner_name || 'Participant Learner',
      sender_role: learnerProfile?.isResearcher ? 'researcher' : 'learner',
      recipient_id: 'instructor',
      content: inputText.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'messages'), newMsg);
      announce('Message sent to instructor.');
      setInputText('');
    } catch (error) {
      console.warn('Error saving message in Firestore:', error);
      // Fallback local state
      setMessages((prev) => [...prev, newMsg]);
      announce('Message posted.');
      setInputText('');
    } finally {
      setIsSending(false);
    }
  };

  const insertQuickTemplate = (text: string) => {
    setInputText(text);
    announce(`Template loaded: ${text}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Messages
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Instructor Online
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Quick Templates */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h2 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Quick Templates
            </h2>

            <div className="space-y-2">
              <button
                onClick={() => insertQuickTemplate('Hello Professor, I would like to request high-contrast slides or plain text lecture notes for Module 1.')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
              >
                Request high-contrast notes
              </button>

              <button
                onClick={() => insertQuickTemplate('Could you verify if the video captions on Unit 3 are synchronized with the speaker audio?')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
              >
                Inquire about video captions
              </button>

              <button
                onClick={() => insertQuickTemplate('I am navigating using keyboard shortcuts. May I submit the lab answers in bullet point form?')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
              >
                Assignment format question
              </button>

              <button
                onClick={() => insertQuickTemplate('Thank you for the detailed feedback on my Activity 1 submission! The screen reader hints were very helpful.')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
              >
                Send feedback message
              </button>
            </div>
          </div>
        </div>

        {/* Right: Message Stream & Composer */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[520px]">
            
            {/* Stream Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-xs text-slate-900">
                  Course Discussion Channel
                </h3>
              </div>
            </div>

            {/* Messages Body */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3"
              tabIndex={0}
              aria-label="Direct message stream"
            >
              {loading ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Loading messages from database...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No messages in database yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Start a conversation with your instructor or peers using the input box below.
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.sender_id === learnerProfile?.id;
                  return (
                    <div
                      key={msg.id || i}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[11px]">
                        <span className="font-bold text-slate-800">{msg.sender_name}</span>
                        <span className="text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          onClick={() => speakText(`${msg.sender_name} says: ${msg.content}`)}
                          className="text-slate-400 hover:text-indigo-600 p-0.5"
                          title="Read this message aloud"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-tr-xs'
                            : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-tl-xs'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Composer */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex gap-2">
              <label htmlFor="message-input" className="sr-only">Type a message to instructor</label>
              <input
                id="message-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message or question to the instructor..."
                className="flex-1 p-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={isSending || !inputText.trim()}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>

          </div>
        </div>

      </div>

    </div>
  );
};
