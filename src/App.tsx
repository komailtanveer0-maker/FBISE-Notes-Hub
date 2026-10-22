import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Download, 
  Layers, 
  GraduationCap, 
  ShieldCheck, 
  FileText, 
  TrendingUp,
  Search,
  Users,
  Award
} from 'lucide-react';
import { Note, ClassLevel } from './types/notes';
import { Navbar } from './components/Navbar';
import { HeroThreeScene } from './components/HeroThreeScene';
import { ClassCard } from './components/ClassCard';
import { NoteCard } from './components/NoteCard';
import { NoteDetailModal } from './components/NoteDetailModal';
import { StudentPortal } from './components/StudentPortal';
import { TeacherLoginModal } from './components/TeacherLoginModal';
import { TeacherDashboard } from './components/TeacherDashboard';
import { PublicResourcesSection } from './components/PublicResourcesSection';
import { Footer } from './components/Footer';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'student' | 'notes' | 'class' | 'teacher-dashboard' | 'resources'>('home');
  const [selectedClass, setSelectedClass] = useState<ClassLevel | 'all'>('all');
  const [activeNoteDetail, setActiveNoteDetail] = useState<Note | null>(null);
  const [teacherLoginOpen, setTeacherLoginOpen] = useState(false);
  
  // Teacher session
  const [teacherToken, setTeacherToken] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState<string>('FBISE Educator');

  // Home recent notes & stats
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [classCounts, setClassCounts] = useState<Record<ClassLevel, number>>({
    '9th': 0,
    '10th': 0,
    '1st-year': 0,
    '2nd-year': 0
  });

  // Parse path on initial load and handle browser popstate
  const syncRouteFromPath = () => {
    const path = window.location.pathname.toLowerCase();
    if (path === '/student') {
      setCurrentView('student');
      setSelectedClass('all');
    } else if (path === '/notes') {
      setCurrentView('notes');
      setSelectedClass('all');
    } else if (path === '/notes/9th') {
      setCurrentView('class');
      setSelectedClass('9th');
    } else if (path === '/notes/10th') {
      setCurrentView('class');
      setSelectedClass('10th');
    } else if (path === '/notes/1st-year' || path === '/notes/11th') {
      setCurrentView('class');
      setSelectedClass('1st-year');
    } else if (path === '/notes/2nd-year' || path === '/notes/12th') {
      setCurrentView('class');
      setSelectedClass('2nd-year');
    } else if (path === '/teacher') {
      setTeacherLoginOpen(true);
    } else if (path === '/teacher/dashboard' || path === '/teacher/upload') {
      const token = localStorage.getItem('fbise_teacher_token');
      if (token) {
        setTeacherToken(token);
        setCurrentView('teacher-dashboard');
      } else {
        setTeacherLoginOpen(true);
      }
    } else if (path === '/resources') {
      setCurrentView('resources');
    } else {
      setCurrentView('home');
    }
  };

  useEffect(() => {
    syncRouteFromPath();
    window.addEventListener('popstate', syncRouteFromPath);

    // Check stored teacher token on boot
    const storedToken = localStorage.getItem('fbise_teacher_token');
    const storedName = localStorage.getItem('fbise_teacher_name');
    if (storedToken) {
      fetch('/api/teacher/verify', {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setTeacherToken(storedToken);
          if (storedName) setTeacherName(storedName);
        } else {
          localStorage.removeItem('fbise_teacher_token');
          localStorage.removeItem('fbise_teacher_name');
        }
      })
      .catch(() => {});
    }

    // Fetch initial notes and class statistics
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.stats) {
          setRecentNotes(data.stats.recentNotes || []);
          if (data.stats.notesByClass) {
            setClassCounts(data.stats.notesByClass);
          }
        }
      })
      .catch(err => console.error('Failed to load stats:', err));

    return () => {
      window.removeEventListener('popstate', syncRouteFromPath);
    };
  }, []);

  // Navigation router
  const navigateTo = (view: string, params?: { classLevel?: ClassLevel; noteId?: string }) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (view === 'home') {
      window.history.pushState({}, '', '/');
      setCurrentView('home');
    } else if (view === 'student') {
      window.history.pushState({}, '', '/student');
      setSelectedClass('all');
      setCurrentView('student');
    } else if (view === 'notes') {
      window.history.pushState({}, '', '/notes');
      setSelectedClass('all');
      setCurrentView('notes');
    } else if (view === 'class' && params?.classLevel) {
      window.history.pushState({}, '', `/notes/${params.classLevel}`);
      setSelectedClass(params.classLevel);
      setCurrentView('class');
    } else if (view === 'teacher-login') {
      if (teacherToken) {
        window.history.pushState({}, '', '/teacher/dashboard');
        setCurrentView('teacher-dashboard');
      } else {
        setTeacherLoginOpen(true);
      }
    } else if (view === 'teacher-dashboard') {
      if (teacherToken) {
        window.history.pushState({}, '', '/teacher/dashboard');
        setCurrentView('teacher-dashboard');
      } else {
        setTeacherLoginOpen(true);
      }
    } else if (view === 'resources') {
      window.history.pushState({}, '', '/resources');
      setCurrentView('resources');
    }
  };

  // Download handler
  const handleDownloadNote = (note: Note) => {
    const link = document.createElement('a');
    link.href = `/api/notes/${note.id}/file?download=true`;
    link.download = note.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Optimistically increment downloads in recent notes
    setRecentNotes(prev => prev.map(n => n.id === note.id ? { ...n, downloads_count: (n.downloads_count || 0) + 1 } : n));
    if (activeNoteDetail && activeNoteDetail.id === note.id) {
      setActiveNoteDetail(prev => prev ? { ...prev, downloads_count: (prev.downloads_count || 0) + 1 } : null);
    }
  };

  // Teacher Logout
  const handleTeacherLogout = async () => {
    if (teacherToken) {
      try {
        await fetch('/api/teacher/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${teacherToken}` }
        });
      } catch (e) {}
    }
    localStorage.removeItem('fbise_teacher_token');
    localStorage.removeItem('fbise_teacher_name');
    setTeacherToken(null);
    if (currentView === 'teacher-dashboard') {
      navigateTo('home');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#151820] selection:bg-[#F4B942]/30 selection:text-[#301934]">
      
      {/* Universal Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={navigateTo}
        isTeacherAuthenticated={!!teacherToken}
        onTeacherLogout={handleTeacherLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* VIEW 1: HOME PAGE */}
        {currentView === 'home' && (
          <div>
            
            {/* HERO SECTION */}
            <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 border-b border-[#DCE5EC]/80 bg-gradient-to-b from-[#EEF4F8]/70 via-[#F8FAFC] to-[#F8FAFC]">
              
              {/* Background ambient lighting */}
              <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#DCE5EC]/50 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-40 right-10 w-96 h-96 bg-[#F4B942]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  
                  {/* Left Column: Headlines & Interactive Options */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#301934] text-[#F8FAFC] text-xs font-semibold shadow-xs">
                      <GraduationCap className="w-4 h-4 text-[#F4B942]" />
                      <span>Federal Board of Intermediate & Secondary Education</span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#301934] tracking-tight leading-[1.12]">
                      Study Smarter. <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#301934] via-[#48264e] to-[#F4B942]">
                        Prepare with Confidence.
                      </span>
                    </h1>

                    {/* Supporting Text */}
                    <p className="text-base sm:text-lg text-[#151820]/80 leading-relaxed max-w-xl">
                      Discover organized FBISE notes, revision materials, and study resources shared by teachers. Engineered specifically for 9th, 10th, 1st Year, and 2nd Year scholars.
                    </p>

                    {/* Two Prominent Interactive Options */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                      <button
                        type="button"
                        onClick={() => navigateTo('student')}
                        className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#F4B942] hover:bg-[#e5a72f] text-[#301934] font-bold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
                      >
                        <BookOpen className="w-5 h-5" />
                        <span>Explore as Student</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTo('teacher-login')}
                        className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#301934] hover:bg-[#48264e] text-[#F8FAFC] font-bold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
                      >
                        <Lock className="w-5 h-5 text-[#F4B942]" />
                        <span>Teacher Portal</span>
                      </button>
                    </div>

                    {/* Value Metrics Bar */}
                    <div className="pt-6 border-t border-[#DCE5EC] grid grid-cols-3 gap-4 text-left">
                      <div>
                        <div className="font-display font-bold text-xl sm:text-2xl text-[#301934]">
                          4 Classes
                        </div>
                        <div className="text-xs text-[#151820]/60">
                          SSC & HSSC Syllabi
                        </div>
                      </div>
                      <div>
                        <div className="font-display font-bold text-xl sm:text-2xl text-[#301934]">
                          100% Free
                        </div>
                        <div className="text-xs text-[#151820]/60">
                          Open Student Access
                        </div>
                      </div>
                      <div>
                        <div className="font-display font-bold text-xl sm:text-2xl text-[#301934]">
                          SLO Aligned
                        </div>
                        <div className="text-xs text-[#151820]/60">
                          Federal Board Pattern
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Three.js 3D Hero Scene */}
                  <div className="lg:col-span-5">
                    <HeroThreeScene />
                  </div>

                </div>
              </div>
            </section>

            {/* SECTION 2: EXPLORE YOUR CLASS */}
            <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs font-bold uppercase tracking-wider text-[#301934] bg-[#DCE5EC]/70 px-3 py-1 rounded-full">
                  Academic Streams
                </span>
                <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#301934] mt-2 mb-3">
                  Explore Your Class
                </h2>
                <p className="text-sm text-[#151820]/75 leading-relaxed">
                  Select your academic level to access subject-wise notes, solved past papers, formula sheets, and chapter-by-chapter summaries.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ClassCard
                  level="9th"
                  notesCount={classCounts['9th']}
                  onSelect={(lvl) => navigateTo('class', { classLevel: lvl })}
                />
                <ClassCard
                  level="10th"
                  notesCount={classCounts['10th']}
                  onSelect={(lvl) => navigateTo('class', { classLevel: lvl })}
                />
                <ClassCard
                  level="1st-year"
                  notesCount={classCounts['1st-year']}
                  onSelect={(lvl) => navigateTo('class', { classLevel: lvl })}
                />
                <ClassCard
                  level="2nd-year"
                  notesCount={classCounts['2nd-year']}
                  onSelect={(lvl) => navigateTo('class', { classLevel: lvl })}
                />
              </div>
            </section>

            {/* SECTION 3: RECENTLY UPLOADED NOTES */}
            <section className="py-16 bg-[#EEF4F8]/60 border-y border-[#DCE5EC]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#301934] bg-[#DCE5EC] px-3 py-1 rounded-full">
                      Real Database Notes
                    </span>
                    <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#301934] mt-2">
                      Recently Uploaded Notes
                    </h2>
                    <p className="text-sm text-[#151820]/75 mt-1">
                      Direct from verified teachers and instructors across Pakistan.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateTo('student')}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#301934] hover:text-[#e5a72f] transition-colors cursor-pointer"
                  >
                    <span>View All in Library</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentNotes.slice(0, 3).map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onPreview={(n) => setActiveNoteDetail(n)}
                      onDownload={handleDownloadNote}
                    />
                  ))}
                </div>

              </div>
            </section>

            {/* SECTION 4: WHY STUDY WITH US */}
            <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14">
                <span className="text-xs font-bold uppercase tracking-wider text-[#301934] bg-[#DCE5EC]/70 px-3 py-1 rounded-full">
                  Excellence in EdTech
                </span>
                <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#301934] mt-2 mb-3">
                  Why Study with FBISE Notes Hub?
                </h2>
                <p className="text-sm text-[#151820]/75 leading-relaxed">
                  Tailored specifically to the Student Learning Outcomes (SLO) assessment criteria mandated by the Federal Board.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                
                <div className="bg-[#F8FAFC] border border-[#DCE5EC] rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#301934] text-[#F4B942] flex items-center justify-center font-bold">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#301934]">
                    Organized Notes
                  </h3>
                  <p className="text-xs text-[#151820]/75 leading-relaxed">
                    Neatly structured by class, subject, and chapter so you never waste study time searching through chaotic folders.
                  </p>
                </div>

                <div className="bg-[#F8FAFC] border border-[#DCE5EC] rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F4B942] text-[#301934] flex items-center justify-center font-bold">
                    <Download className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#301934]">
                    Instant Downloads
                  </h3>
                  <p className="text-xs text-[#151820]/75 leading-relaxed">
                    One-click direct PDF downloads stored on persistent high-speed servers. No paywalls, no forced sign-ups for students.
                  </p>
                </div>

                <div className="bg-[#F8FAFC] border border-[#DCE5EC] rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#301934] text-[#F4B942] flex items-center justify-center font-bold">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#301934]">
                    Class-Wise Browsing
                  </h3>
                  <p className="text-xs text-[#151820]/75 leading-relaxed">
                    Dedicated portals for 9th, 10th, 1st Year, and 2nd Year with subject-specific filters for science and humanities.
                  </p>
                </div>

                <div className="bg-[#F8FAFC] border border-[#DCE5EC] rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F4B942] text-[#301934] flex items-center justify-center font-bold">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#301934]">
                    Teacher Contributions
                  </h3>
                  <p className="text-xs text-[#151820]/75 leading-relaxed">
                    Contributed and reviewed by verified educators adhering strictly to the latest Federal Board syllabus requirements.
                  </p>
                </div>

              </div>
            </section>

          </div>
        )}

        {/* VIEW 2: STUDENT PORTAL / ALL NOTES LIBRARY / CLASS FILTER */}
        {(currentView === 'student' || currentView === 'notes' || currentView === 'class') && (
          <StudentPortal
            initialClass={selectedClass}
            onPreviewNote={(note) => setActiveNoteDetail(note)}
            onDownloadNote={handleDownloadNote}
          />
        )}

        {/* VIEW 3: TEACHER DASHBOARD */}
        {currentView === 'teacher-dashboard' && teacherToken && (
          <TeacherDashboard
            token={teacherToken}
            teacherName={teacherName}
            onLogout={handleTeacherLogout}
            onViewNoteInLibrary={(noteId) => {
              navigateTo('student');
            }}
          />
        )}

        {/* VIEW 4: PUBLIC FBISE RESOURCES */}
        {currentView === 'resources' && (
          <PublicResourcesSection
            onBackToNotes={() => navigateTo('student')}
          />
        )}

      </main>

      {/* Universal Academic Footer */}
      <Footer onNavigate={navigateTo} />

      {/* Note Detail & Live Preview Modal */}
      {activeNoteDetail && (
        <NoteDetailModal
          note={activeNoteDetail}
          onClose={() => setActiveNoteDetail(null)}
          onDownload={handleDownloadNote}
        />
      )}

      {/* Teacher Secret Code Login Modal */}
      <TeacherLoginModal
        isOpen={teacherLoginOpen}
        onClose={() => setTeacherLoginOpen(false)}
        onSuccess={(session) => {
          setTeacherToken(session.token);
          setTeacherName(session.name);
          navigateTo('teacher-dashboard');
        }}
      />

    </div>
  );
}
