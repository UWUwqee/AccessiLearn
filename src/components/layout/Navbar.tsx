import React, { useState } from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  MessageSquare,
  Award,
  BarChart3,
  LogOut,
  ChevronDown,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openSurveyModal: () => void;
  openAccessibilityModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  openSurveyModal,
  openAccessibilityModal,
}) => {
  const { learnerProfile, logout, user, isAdmin } = useAuth();
  const { announce } = useAccessibility();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'materials', label: 'Materials', icon: BookOpen },
    { id: 'activities', label: 'Activities', icon: FileCheck2 },
    { id: 'communication', label: 'Messages', icon: MessageSquare },
    { id: 'grades', label: 'Grades', icon: Award },
    { id: 'researcher', label: 'Analytics', icon: BarChart3 },
  ];

  const handleNavClick = (tabId: string, label: string) => {
    setCurrentTab(tabId);
    announce(`Navigated to ${label} page.`);
  };

  return (
    <>
      {/* Skip to Main Content Link for screen readers & keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="bg-slate-900 text-white shadow-md relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleNavClick('dashboard', 'Dashboard')}
                className="flex items-center space-x-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg p-1 text-left cursor-pointer"
                aria-label="AccessiLearn Home"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <GraduationCap className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <span className="font-extrabold text-base tracking-tight text-white">AccessiLearn</span>
              </button>
            </div>

            {/* Main Navigation Items */}
            <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id, item.label)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-700 text-white shadow-sm ring-1 ring-indigo-400'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Actions + Google Profile */}
            <div className="flex items-center space-x-2.5">
              {/* Connected Google Account & Profile */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                  aria-label="User account options"
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt=""
                      className="w-6 h-6 rounded-full border border-slate-600 object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-[11px] text-white">
                      {learnerProfile?.learner_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}

                  <div className="text-left hidden md:block">
                    <p className="font-semibold text-slate-100 leading-tight truncate max-w-[120px]">
                      {learnerProfile?.learner_name || user?.displayName || 'User'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {user?.email}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-72 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                    role="menu"
                  >
                    <div className="p-3 border-b border-slate-100 bg-slate-50 rounded-xl mb-2">
                      <p className="font-bold text-slate-900">{learnerProfile?.learner_name || user?.displayName}</p>
                      <p className="text-slate-600 text-[11px] truncate">{user?.email}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                          {learnerProfile?.role || 'learner'}
                        </span>
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                          {learnerProfile?.educational_need || 'SEN Learner'}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setCurrentTab('dashboard');
                        }}
                        className="mb-2 w-full text-left px-3 py-2 text-indigo-700 hover:bg-indigo-50 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-colors"
                        role="menuitem"
                      >
                        <User className="w-4 h-4" />
                        <span>Open admin panel</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-colors"
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation bar */}
          <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id, item.label)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold whitespace-nowrap cursor-pointer ${
                    isActive ? 'bg-indigo-700 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>
    </>
  );
};
