import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal, 
  ArrowUpDown, 
  BookOpen, 
  FileQuestion, 
  RotateCcw,
  Sparkles,
  Layers
} from 'lucide-react';
import { Note, ClassLevel } from '../types/notes';
import { NoteCard } from './NoteCard';
import { CLASS_CONFIG, filterAndSortNotes } from '../utils/notes-logic';

interface StudentPortalProps {
  initialClass?: ClassLevel | 'all';
  onPreviewNote: (note: Note) => void;
  onDownloadNote: (note: Note) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  initialClass = 'all',
  onPreviewNote,
  onDownloadNote
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassLevel | 'all'>(initialClass);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'most-downloaded'>('newest');

  // Update selected class if initialClass prop changes
  useEffect(() => {
    setSelectedClass(initialClass);
  }, [initialClass]);

  // Fetch notes from server
  useEffect(() => {
    setLoading(true);
    fetch('/api/notes')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load notes library.');
        return res.json();
      })
      .then(data => {
        setNotes(data.notes || []);
        setError(null);
      })
      .catch(err => {
        console.error('Notes fetch error:', err);
        setError('Could not connect to notes database. Please check your network.');
      })
      .finally(() => setLoading(false));
  }, []);

  // Compute available subjects based on selected class
  const availableSubjects = useMemo(() => {
    if (selectedClass === 'all') {
      const allSubs = new Set<string>();
      Object.values(CLASS_CONFIG).forEach(c => c.defaultSubjects.forEach(s => allSubs.add(s)));
      return Array.from(allSubs);
    }
    return CLASS_CONFIG[selectedClass]?.defaultSubjects || [];
  }, [selectedClass]);

  // Reset subject filter if it is not in the new availableSubjects
  useEffect(() => {
    if (selectedSubject !== 'all' && !availableSubjects.includes(selectedSubject)) {
      setSelectedSubject('all');
    }
  }, [selectedClass, availableSubjects, selectedSubject]);

  // Filter & sort notes
  const displayedNotes = useMemo(() => {
    return filterAndSortNotes(notes, {
      searchQuery,
      classLevel: selectedClass,
      subject: selectedSubject,
      sortBy
    });
  }, [notes, searchQuery, selectedClass, selectedSubject, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedClass('all');
    setSelectedSubject('all');
    setSortBy('newest');
  };

  const hasActiveFilters = searchQuery !== '' || selectedClass !== 'all' || selectedSubject !== 'all' || sortBy !== 'newest';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Header Banner */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#301934] text-[#F4B942]">
            Student Study Portal
          </span>
          <span className="text-xs text-[#151820]/60">
            {notes.length} Verified Notes Available
          </span>
        </div>

        <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#301934] tracking-tight">
          {selectedClass !== 'all' 
            ? `${CLASS_CONFIG[selectedClass].name} Notes` 
            : 'FBISE Notes & Revision Library'}
        </h1>
        <p className="text-sm text-[#151820]/75 mt-1 max-w-3xl">
          {selectedClass !== 'all'
            ? CLASS_CONFIG[selectedClass].description
            : 'Access syllabus summaries, chapter formulas, SLO question banks, and past paper model answers curated by federal educators.'}
        </p>
      </div>

      {/* Main Search & Filter Control Bar */}
      <div className="bg-[#F8FAFC] border border-[#DCE5EC] rounded-2xl p-4 sm:p-5 shadow-xs mb-8 space-y-4">
        
        {/* Search Bar Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#151820]/40">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, subjects, or topics..."
            className="w-full pl-11 pr-10 py-3 rounded-xl bg-[#EEF4F8]/70 border border-[#DCE5EC] text-[#151820] text-sm placeholder:text-[#151820]/50 focus:outline-none focus:ring-2 focus:ring-[#301934] focus:bg-[#F8FAFC] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#151820]/50 hover:text-[#301934]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Four Class Selector Tabs */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#301934] mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#F4B942]" />
            <span>Select Federal Board Class</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => setSelectedClass('all')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedClass === 'all'
                  ? 'bg-[#301934] text-[#F8FAFC] shadow-sm'
                  : 'bg-[#EEF4F8] text-[#151820]/80 hover:bg-[#DCE5EC]'
              }`}
            >
              All Classes
            </button>
            <button
              type="button"
              onClick={() => setSelectedClass('9th')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedClass === '9th'
                  ? 'bg-[#301934] text-[#F8FAFC] shadow-sm'
                  : 'bg-[#EEF4F8] text-[#151820]/80 hover:bg-[#DCE5EC]'
              }`}
            >
              <span>9th Class</span>
              <span className="text-[10px] opacity-75">(SSC-I)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedClass('10th')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedClass === '10th'
                  ? 'bg-[#301934] text-[#F8FAFC] shadow-sm'
                  : 'bg-[#EEF4F8] text-[#151820]/80 hover:bg-[#DCE5EC]'
              }`}
            >
              <span>10th Class</span>
              <span className="text-[10px] opacity-75">(SSC-II)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedClass('1st-year')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedClass === '1st-year'
                  ? 'bg-[#301934] text-[#F8FAFC] shadow-sm'
                  : 'bg-[#EEF4F8] text-[#151820]/80 hover:bg-[#DCE5EC]'
              }`}
            >
              <span>1st Year</span>
              <span className="text-[10px] opacity-75">(11th)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedClass('2nd-year')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 col-span-2 sm:col-span-1 ${
                selectedClass === '2nd-year'
                  ? 'bg-[#301934] text-[#F8FAFC] shadow-sm'
                  : 'bg-[#EEF4F8] text-[#151820]/80 hover:bg-[#DCE5EC]'
              }`}
            >
              <span>2nd Year</span>
              <span className="text-[10px] opacity-75">(12th)</span>
            </button>
          </div>
        </div>

        {/* Secondary Filters: Subject Filter Chips & Sort Dropdown */}
        <div className="pt-2 border-t border-[#DCE5EC] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Subject Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 flex-1">
            <span className="text-xs font-bold text-[#151820]/60 mr-1">Subject:</span>
            <button
              type="button"
              onClick={() => setSelectedSubject('all')}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                selectedSubject === 'all'
                  ? 'bg-[#301934] text-[#F8FAFC]'
                  : 'bg-[#DCE5EC]/50 text-[#151820]/80 hover:bg-[#DCE5EC]'
              }`}
            >
              All Subjects
            </button>

            {availableSubjects.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubject(sub)}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedSubject === sub
                    ? 'bg-[#301934] text-[#F8FAFC]'
                    : 'bg-[#DCE5EC]/50 text-[#151820]/80 hover:bg-[#DCE5EC]'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Sort Dropdown & Clear Filters */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#151820]/60" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-[#EEF4F8] border border-[#DCE5EC] rounded-xl px-2.5 py-1.5 font-semibold text-[#151820] focus:outline-none"
              >
                <option value="newest">Newest Uploads</option>
                <option value="most-downloaded">Most Downloaded</option>
                <option value="title-asc">Title: A to Z</option>
                <option value="title-desc">Title: Z to A</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-bold text-[#301934] hover:text-[#e5a72f] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-semibold text-[#151820]/75">
          Showing <strong className="text-[#301934]">{displayedNotes.length}</strong> matching notes
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-3 border-[#301934] border-t-[#F4B942] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#301934]">
            Fetching FBISE notes database...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center text-red-800 space-y-2">
          <p className="font-bold text-sm">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && displayedNotes.length === 0 && (
        <div className="py-16 px-4 text-center rounded-3xl bg-[#EEF4F8]/50 border border-dashed border-[#DCE5EC] space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#DCE5EC] text-[#301934] flex items-center justify-center mx-auto">
            <FileQuestion className="w-8 h-8 text-[#301934]/60" />
          </div>
          <h3 className="font-display font-bold text-xl text-[#301934]">
            No matching study notes found
          </h3>
          <p className="text-xs text-[#151820]/70 max-w-md mx-auto">
            We couldn't find any notes matching your current search or subject filter criteria.
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#301934] text-[#F8FAFC] text-xs font-bold hover:bg-[#48264e] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#F4B942]" />
            <span>Clear All Filters</span>
          </button>
        </div>
      )}

      {/* Notes Grid */}
      {!loading && !error && displayedNotes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onPreview={onPreviewNote}
              onDownload={onDownloadNote}
            />
          ))}
        </div>
      )}

    </div>
  );
};
