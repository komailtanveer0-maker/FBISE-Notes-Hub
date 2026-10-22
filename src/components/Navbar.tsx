import React, { useState } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Compass, 
  Lock, 
  Menu, 
  X, 
  ChevronDown, 
  Sparkles, 
  CheckCircle2, 
  LogOut,
  ExternalLink
} from 'lucide-react';
import { ClassLevel } from '../types/notes';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, params?: { classLevel?: ClassLevel; noteId?: string }) => void;
  isTeacherAuthenticated: boolean;
  onTeacherLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  isTeacherAuthenticated,
  onTeacherLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [classesDropdownOpen, setClassesDropdownOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'student', label: 'Student Portal' },
    { id: 'notes', label: 'Notes Library' },
    { id: 'resources', label: 'Public Resources' },
  ];

  const classList: Array<{ level: ClassLevel; label: string; badge: string }> = [
    { level: '9th', label: '9th Class', badge: 'SSC-I' },
    { level: '10th', label: '10th Class', badge: 'SSC-II' },
    { level: '1st-year', label: '1st Year', badge: 'HSSC-I' },
    { level: '2nd-year', label: '2nd Year', badge: 'HSSC-II' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#F8FAFC]/95 backdrop-blur-md border-b border-[#DCE5EC] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo with Custom Academic Crest */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3.5 group text-left cursor-pointer focus:outline-none"
          >
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#301934] to-[#1f0f22] p-0.5 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full rounded-[10px] bg-[#301934] flex items-center justify-center border border-[#F4B942]/30">
                <GraduationCap className="w-6 h-6 text-[#F4B942]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#F4B942] rounded-full border-2 border-[#F8FAFC] flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#301934] rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-xl sm:text-2xl text-[#301934] tracking-tight">
                  FBISE <span className="text-[#151820] font-medium">Notes Hub</span>
                </span>
                <span className="hidden md:inline-block bg-[#301934] text-[#F4B942] font-bold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider ml-1">
                  Federal Board
                </span>
              </div>
              <p className="text-[11px] text-[#151820]/60 font-medium tracking-wide">
                Pakistan Educational Technology Portal
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  currentView === item.id
                    ? 'text-[#301934] bg-[#DCE5EC]/60 shadow-xs'
                    : 'text-[#151820]/75 hover:text-[#301934] hover:bg-[#DCE5EC]/30'
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* Classes Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setClassesDropdownOpen(!classesDropdownOpen)}
                onBlur={() => setTimeout(() => setClassesDropdownOpen(false), 200)}
                className="flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-semibold text-[#151820]/75 hover:text-[#301934] hover:bg-[#DCE5EC]/30 transition-all cursor-pointer"
              >
                <span>Classes</span>
                <ChevronDown className={`w-4 h-4 text-[#151820]/50 transition-transform ${classesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {classesDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#F8FAFC] border border-[#DCE5EC] rounded-xl shadow-xl py-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#151820]/50 border-b border-[#DCE5EC]/60 mb-1">
                    Select FBISE Class
                  </div>
                  {classList.map((c) => (
                    <button
                      key={c.level}
                      type="button"
                      onClick={() => {
                        onNavigate('class', { classLevel: c.level });
                        setClassesDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-sm text-[#151820] hover:bg-[#DCE5EC]/50 hover:text-[#301934] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-medium">{c.label}</span>
                      <span className="text-[10px] font-bold bg-[#DCE5EC] text-[#301934] px-1.5 py-0.5 rounded">
                        {c.badge}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {isTeacherAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('teacher-dashboard')}
                  className="flex items-center gap-2 bg-[#301934] text-[#F8FAFC] hover:bg-[#48264e] px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-[#F4B942]" />
                  <span>Teacher Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={onTeacherLogout}
                  className="p-2 text-[#151820]/60 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Sign out of teacher portal"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('teacher-login')}
                className="flex items-center gap-2 border border-[#301934]/30 text-[#301934] hover:bg-[#301934] hover:text-[#F8FAFC] px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer shadow-xs group"
              >
                <Lock className="w-4 h-4 text-[#F4B942] group-hover:text-[#F4B942]" />
                <span>Teacher Access</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate('student')}
              className="flex items-center gap-2 bg-gradient-to-r from-[#F4B942] to-[#e5a72f] text-[#301934] hover:brightness-105 font-bold px-4 py-2 rounded-xl text-sm shadow-md transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Notes</span>
            </button>
          </div>

          {/* Mobile menu hamburger toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#301934] hover:bg-[#DCE5EC]/60 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#F8FAFC] border-b border-[#DCE5EC] px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#DCE5EC]">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-2.5 rounded-lg text-sm font-semibold text-left transition-colors ${
                  currentView === item.id
                    ? 'bg-[#301934] text-[#F8FAFC]'
                    : 'text-[#151820] hover:bg-[#DCE5EC]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#151820]/60 mb-2">
              Browse Classes
            </div>
            <div className="grid grid-cols-2 gap-2">
              {classList.map((c) => (
                <button
                  key={c.level}
                  type="button"
                  onClick={() => {
                    onNavigate('class', { classLevel: c.level });
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-2 rounded-lg bg-[#DCE5EC]/40 text-xs font-semibold text-[#301934] hover:bg-[#DCE5EC] flex items-center justify-between"
                >
                  <span>{c.label}</span>
                  <span className="text-[10px] bg-[#301934] text-[#F8FAFC] px-1 py-0.5 rounded">
                    {c.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            {isTeacherAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  onNavigate('teacher-dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 bg-[#301934] text-[#F8FAFC] font-semibold text-sm rounded-xl flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-[#F4B942]" />
                Teacher Dashboard
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onNavigate('teacher-login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 border border-[#301934] text-[#301934] font-semibold text-sm rounded-xl flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-[#F4B942]" />
                Teacher Portal Login
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onNavigate('student');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 bg-[#F4B942] text-[#301934] font-bold text-sm rounded-xl flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Explore as Student
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
