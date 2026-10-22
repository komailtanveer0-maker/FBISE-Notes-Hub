import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Files, 
  LogOut, 
  FileText, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  HardDrive, 
  Download, 
  Layers, 
  X, 
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { Note, ClassLevel, DashboardStats, StudyGroup } from '../types/notes';
import { CLASS_CONFIG, STUDY_GROUPS, validateNoteUpload, formatBytes } from '../utils/notes-logic';

interface TeacherDashboardProps {
  token: string;
  teacherName: string;
  onLogout: () => void;
  onViewNoteInLibrary: (noteId: string) => void;
}

type TabType = 'overview' | 'upload' | 'manage';

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  token,
  teacherName,
  onLogout,
  onViewNoteInLibrary
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classLevel, setClassLevel] = useState<ClassLevel>('9th');
  const [subject, setSubject] = useState(CLASS_CONFIG['9th'].defaultSubjects[0]);
  const [customSubject, setCustomSubject] = useState('');
  const [studyGroup, setStudyGroup] = useState<StudyGroup>('Science (Pre-Engineering)');
  const [chapter, setChapter] = useState('');
  const [tags, setTags] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Manage Notes State
  const [manageSearch, setManageSearch] = useState('');
  const [manageClassFilter, setManageClassFilter] = useState<string>('all');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch stats and notes from server
  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, notesRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/notes')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData.notes || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Update default subject options when class level changes
  useEffect(() => {
    const defaultSubs = CLASS_CONFIG[classLevel]?.defaultSubjects || [];
    if (defaultSubs.length > 0 && !defaultSubs.includes(subject)) {
      setSubject(defaultSubs[0]);
    }
  }, [classLevel]);

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle Upload Submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);

    const activeSubject = subject === '__CUSTOM__' ? customSubject.trim() : subject;

    const validation = validateNoteUpload({
      title,
      description,
      class_level: classLevel,
      subject: activeSubject,
      hasFile: !!selectedFile
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      setUploadError(firstError);
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('class_level', classLevel);
    formData.append('subject', activeSubject);
    formData.append('study_group', studyGroup);
    formData.append('chapter', chapter.trim());
    formData.append('tags', tags.trim());
    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    try {
      setUploadProgress(60);
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      setUploadProgress(100);

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload note.');
      }

      setUploadSuccess(`Note "${data.note.title}" published successfully to ${data.note.class_level.toUpperCase()} library!`);
      // Reset form fields
      setTitle('');
      setDescription('');
      setChapter('');
      setTags('');
      setSelectedFile(null);
      setCustomSubject('');

      // Refresh data
      await loadDashboardData();
    } catch (err: any) {
      setUploadError(err.message || 'Server error while uploading. Please retry.');
    } finally {
      setUploading(false);
    }
  };

  // Handle Note Deletion
  const handleDeleteConfirm = async () => {
    if (!deletingNote) return;

    try {
      const res = await fetch(`/api/notes/${deletingNote.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete note.');
      }

      setActionMessage({ type: 'success', text: `Note "${deletingNote.title}" removed permanently.` });
      setDeletingNote(null);
      await loadDashboardData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Could not delete note.' });
    }
  };

  // Handle Note Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;

    try {
      const res = await fetch(`/api/notes/${editingNote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editingNote.title,
          description: editingNote.description,
          class_level: editingNote.class_level,
          subject: editingNote.subject,
          study_group: editingNote.study_group,
          chapter: editingNote.chapter,
          tags: editingNote.tags
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update note.');
      }

      setActionMessage({ type: 'success', text: `Note updated successfully.` });
      setEditingNote(null);
      await loadDashboardData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Could not update note.' });
    }
  };

  // Filter notes for Manage table
  const filteredNotes = notes.filter(n => {
    const matchesClass = manageClassFilter === 'all' || n.class_level === manageClassFilter;
    const matchesSearch = !manageSearch || 
      n.title.toLowerCase().includes(manageSearch.toLowerCase()) ||
      n.subject.toLowerCase().includes(manageSearch.toLowerCase());
    return matchesClass && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#301934] via-[#48264e] to-[#1f0f22] rounded-3xl p-6 sm:p-8 text-[#F8FAFC] shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F4B942] text-[#301934]">
              Educator Portal
            </span>
            <span className="text-xs text-[#DCE5EC]/80">
              Session Active
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl">
            Welcome, {teacherName}
          </h1>
          <p className="text-sm text-[#DCE5EC]/75 mt-1">
            Manage your FBISE curriculum notes, review student reach, and upload new study materials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-[#F8FAFC]/10 hover:bg-[#F8FAFC]/20 text-[#F8FAFC] transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Dashboard Layout with Left Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-[#F8FAFC] border border-[#DCE5EC] rounded-2xl p-3 shadow-xs">
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#301934] text-[#F8FAFC] shadow-sm'
                    : 'text-[#151820]/75 hover:bg-[#DCE5EC]/40 hover:text-[#301934]'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'overview' ? 'text-[#F4B942]' : ''}`} />
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-[#301934] text-[#F8FAFC] shadow-sm'
                    : 'text-[#151820]/75 hover:bg-[#DCE5EC]/40 hover:text-[#301934]'
                }`}
              >
                <UploadCloud className={`w-4 h-4 ${activeTab === 'upload' ? 'text-[#F4B942]' : ''}`} />
                <span>Upload Notes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'manage'
                    ? 'bg-[#301934] text-[#F8FAFC] shadow-sm'
                    : 'text-[#151820]/75 hover:bg-[#DCE5EC]/40 hover:text-[#301934]'
                }`}
              >
                <Files className={`w-4 h-4 ${activeTab === 'manage' ? 'text-[#F4B942]' : ''}`} />
                <span>Manage Notes</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#DCE5EC] text-[#301934] font-bold">
                  {notes.length}
                </span>
              </button>
            </nav>
          </div>

          {/* Quick Storage Status Card */}
          <div className="bg-[#EEF4F8] border border-[#DCE5EC] rounded-2xl p-4 text-xs text-[#151820]/80 space-y-2">
            <div className="flex items-center justify-between font-bold text-[#301934]">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-[#F4B942]" />
                Disk Storage
              </span>
              <span>{formatBytes(stats?.storageUsedBytes || 0)}</span>
            </div>
            <p className="text-[11px] text-[#151820]/60">
              Persistent server storage in <code className="bg-[#DCE5EC] px-1 rounded">/uploads</code>.
            </p>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3">
          
          {/* Action notification banners */}
          {actionMessage && (
            <div className={`p-4 rounded-2xl mb-6 text-sm flex items-center justify-between ${
              actionMessage.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {actionMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span>{actionMessage.text}</span>
              </div>
              <button 
                type="button"
                onClick={() => setActionMessage(null)}
                className="text-xs font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#F8FAFC] border border-[#DCE5EC] rounded-2xl p-5 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#151820]/60 block mb-1">
                    Total Notes
                  </span>
                  <div className="font-display font-bold text-3xl text-[#301934]">
                    {stats?.totalNotes || notes.length}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                    Available in public library
                  </span>
                </div>

                <div className="bg-[#F8FAFC] border border-[#DCE5EC] rounded-2xl p-5 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#151820]/60 block mb-1">
                    Student Downloads
                  </span>
                  <div className="font-display font-bold text-3xl text-[#F4B942]">
                    {stats?.totalDownloads || 0}
                  </div>
                  <span className="text-[11px] text-[#151820]/60 font-medium mt-1 block">
                    Verified downloads
                  </span>
                </div>

                <div className="bg-[#F8FAFC] border border-[#DCE5EC] rounded-2xl p-5 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#151820]/60 block mb-1">
                    Active Classes
                  </span>
                  <div className="font-display font-bold text-3xl text-[#301934]">
                    4
                  </div>
                  <span className="text-[11px] text-[#151820]/60 font-medium mt-1 block">
                    9th, 10th, 11th, 12th
                  </span>
                </div>

                <div className="bg-[#F8FAFC] border border-[#DCE5EC] rounded-2xl p-5 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#151820]/60 block mb-1">
                    Files In Storage
                  </span>
                  <div className="font-display font-bold text-2xl text-[#301934] truncate">
                    {formatBytes(stats?.storageUsedBytes || 0)}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                    Persistent PDF disk files
                  </span>
                </div>
              </div>

              {/* Class Breakdown Grid */}
              <div className="bg-[#F8FAFC] border border-[#DCE5EC] rounded-2xl p-6 shadow-xs">
                <h3 className="font-display font-bold text-lg text-[#301934] mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#F4B942]" />
                  Notes Breakdown by Federal Board Class
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(['9th', '10th', '1st-year', '2nd-year'] as ClassLevel[]).map((level) => {
                    const count = stats?.notesByClass?.[level] ?? notes.filter(n => n.class_level === level).length;
                    const config = CLASS_CONFIG[level];
                    return (
                      <div key={level} className="bg-[#EEF4F8] border border-[#DCE5EC] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold bg-[#301934] text-[#F8FAFC] px-2 py-0.5 rounded">
                            {config.badge}
                          </span>
                          <span className="text-sm font-bold text-[#301934]">
                            {count} {count === 1 ? 'Note' : 'Notes'}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[#151820]">
                          {config.name.split('(')[0]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Notes Table */}
              <div className="bg-[#F8FAFC] border border-[#DCE5EC] rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-lg text-[#301934] flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#F4B942]" />
                    Recently Uploaded Notes
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#301934] hover:text-[#F4B942] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Upload New
                  </button>
                </div>

                <div className="divide-y divide-[#DCE5EC]/60">
                  {notes.slice(0, 5).map((n) => (
                    <div key={n.id} className="py-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold bg-[#301934] text-[#F8FAFC] px-1.5 py-0.2 rounded">
                            {CLASS_CONFIG[n.class_level]?.badge}
                          </span>
                          <span className="text-xs font-semibold text-[#301934]">
                            {n.subject}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#151820] truncate">
                          {n.title}
                        </h4>
                        <span className="text-[11px] text-[#151820]/60">
                          {n.file_name} • {formatBytes(n.file_size)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onViewNoteInLibrary(n.id)}
                        className="text-xs font-semibold text-[#301934] hover:text-[#F4B942] shrink-0 flex items-center gap-1"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* 2. UPLOAD NOTES TAB */}
          {activeTab === 'upload' && (
            <div className="bg-[#F8FAFC] border border-[#DCE5EC] rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="mb-6">
                <h3 className="font-display font-bold text-xl sm:text-2xl text-[#301934] flex items-center gap-2">
                  <UploadCloud className="w-6 h-6 text-[#F4B942]" />
                  Upload & Publish FBISE Notes
                </h3>
                <p className="text-xs text-[#151820]/75 mt-1">
                  Upload study documents directly from your device. Supported formats: PDF, DOCX, and high-resolution diagrams.
                </p>
              </div>

              {/* Success Banner */}
              {uploadSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm mb-6 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Publication Successful! </strong>
                    {uploadSuccess}
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {uploadError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm mb-6 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Validation Issue: </strong>
                    {uploadError}
                  </div>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-6">
                
                {/* Drag & Drop File Zone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#301934] mb-2">
                    Study Document File * (PDF preferred)
                  </label>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                      dragActive
                        ? 'border-[#F4B942] bg-[#F4B942]/10'
                        : selectedFile
                        ? 'border-emerald-500 bg-emerald-50/40'
                        : 'border-[#DCE5EC] bg-[#EEF4F8]/60 hover:bg-[#EEF4F8]'
                    }`}
                  >
                    <input
                      id="note-file-input"
                      type="file"
                      accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="note-file-input" className="cursor-pointer block">
                      {selectedFile ? (
                        <div className="space-y-2">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="font-bold text-sm text-[#301934]">
                            {selectedFile.name}
                          </div>
                          <div className="text-xs text-[#151820]/60">
                            {formatBytes(selectedFile.size)} • Ready for upload
                          </div>
                          <span className="text-xs font-semibold text-[#F4B942] hover:underline block">
                            Click to change file
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-12 h-12 rounded-full bg-[#DCE5EC] text-[#301934] mx-auto flex items-center justify-center">
                            <UploadCloud className="w-6 h-6 text-[#301934]" />
                          </div>
                          <div className="font-bold text-sm text-[#301934]">
                            Drag & drop your study file here, or browse
                          </div>
                          <p className="text-xs text-[#151820]/60">
                            PDF, DOCX, DOC up to 30 MB
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="note-title" className="block text-xs font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                    Note Title *
                  </label>
                  <input
                    id="note-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Chapter 3: Laws of Motion - Solved Numericals & SLO Summary"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#DCE5EC] text-[#151820] text-sm focus:outline-none focus:ring-2 focus:ring-[#301934]"
                    required
                  />
                </div>

                {/* Class & Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="note-class" className="block text-xs font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                      Class Level *
                    </label>
                    <select
                      id="note-class"
                      value={classLevel}
                      onChange={(e) => setClassLevel(e.target.value as ClassLevel)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#DCE5EC] text-[#151820] text-sm focus:outline-none focus:ring-2 focus:ring-[#301934]"
                    >
                      <option value="9th">9th Class (SSC Part I)</option>
                      <option value="10th">10th Class (SSC Part II)</option>
                      <option value="1st-year">1st Year (HSSC Part I - 11th)</option>
                      <option value="2nd-year">2nd Year (HSSC Part II - 12th)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="note-subject" className="block text-xs font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                      Subject *
                    </label>
                    <select
                      id="note-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#DCE5EC] text-[#151820] text-sm focus:outline-none focus:ring-2 focus:ring-[#301934]"
                    >
                      {CLASS_CONFIG[classLevel].defaultSubjects.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="__CUSTOM__">+ Other Custom Subject</option>
                    </select>
                  </div>
                </div>

                {/* Custom Subject field if selected */}
                {subject === '__CUSTOM__' && (
                  <div>
                    <label htmlFor="custom-subject" className="block text-xs font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                      Enter Custom Subject Name *
                    </label>
                    <input
                      id="custom-subject"
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="e.g. Islamic History / Statistics"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#DCE5EC] text-[#151820] text-sm focus:outline-none focus:ring-2 focus:ring-[#301934]"
                      required
                    />
                  </div>
                )}

                {/* Study Group & Chapter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="note-group" className="block text-xs font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                      Study Group (Optional)
                    </label>
                    <select
                      id="note-group"
                      value={studyGroup}
                      onChange={(e) => setStudyGroup(e.target.value as StudyGroup)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#DCE5EC] text-[#151820] text-sm focus:outline-none focus:ring-2 focus:ring-[#301934]"
                    >
                      {STUDY_GROUPS.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="note-chapter" className="block text-xs font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                      Chapter / Topic (Optional)
                    </label>
                    <input
                      id="note-chapter"
                      type="text"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      placeholder="e.g. Chapter 4: Work and Energy"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#DCE5EC] text-[#151820] text-sm focus:outline-none focus:ring-2 focus:ring-[#301934]"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="note-description" className="block text-xs font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                    Description & Learning Outcomes *
                  </label>
                  <textarea
                    id="note-description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what key concepts, formulas, SLOs, or solved board questions are covered in this study file..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#DCE5EC] text-[#151820] text-sm focus:outline-none focus:ring-2 focus:ring-[#301934]"
                    required
                  />
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="note-tags" className="block text-xs font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                    Curriculum Tags (comma-separated, optional)
                  </label>
                  <input
                    id="note-tags"
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g. Model Paper, Solved SLOs, Board Exam, Formula Sheet"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#DCE5EC] text-[#151820] text-sm focus:outline-none focus:ring-2 focus:ring-[#301934]"
                  />
                </div>

                {/* Progress bar */}
                {uploading && (
                  <div className="w-full bg-[#DCE5EC] rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-[#F4B942] h-2.5 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3.5 rounded-xl bg-[#301934] hover:bg-[#48264e] text-[#F8FAFC] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-5 h-5 text-[#F4B942]" />
                  <span>{uploading ? `Uploading Note (${uploadProgress}%)...` : 'Upload & Publish Note'}</span>
                </button>
              </form>
            </div>
          )}

          {/* 3. MANAGE NOTES TAB */}
          {activeTab === 'manage' && (
            <div className="bg-[#F8FAFC] border border-[#DCE5EC] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-xl sm:text-2xl text-[#301934] flex items-center gap-2">
                    <Files className="w-6 h-6 text-[#F4B942]" />
                    Manage Uploaded Notes
                  </h3>
                  <p className="text-xs text-[#151820]/75 mt-1">
                    Edit metadata, view downloads, or remove notes from the library.
                  </p>
                </div>

                {/* Filter and Search controls */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#151820]/40" />
                    <input
                      type="text"
                      value={manageSearch}
                      onChange={(e) => setManageSearch(e.target.value)}
                      placeholder="Search title..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#DCE5EC] text-xs focus:outline-none focus:ring-1 focus:ring-[#301934]"
                    />
                  </div>

                  <select
                    value={manageClassFilter}
                    onChange={(e) => setManageClassFilter(e.target.value)}
                    className="py-1.5 px-3 rounded-xl bg-[#F8FAFC] border border-[#DCE5EC] text-xs focus:outline-none font-medium"
                  >
                    <option value="all">All Classes</option>
                    <option value="9th">9th Class</option>
                    <option value="10th">10th Class</option>
                    <option value="1st-year">1st Year</option>
                    <option value="2nd-year">2nd Year</option>
                  </select>
                </div>
              </div>

              {/* Notes Table */}
              <div className="overflow-x-auto border border-[#DCE5EC] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EEF4F8] text-[#301934] font-bold border-b border-[#DCE5EC]">
                    <tr>
                      <th className="p-3.5">Title & Subject</th>
                      <th className="p-3.5">Class</th>
                      <th className="p-3.5">File Details</th>
                      <th className="p-3.5">Downloads</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5EC]/60">
                    {filteredNotes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-[#151820]/60">
                          No matching notes found. Try adjusting your search query or filters.
                        </td>
                      </tr>
                    ) : (
                      filteredNotes.map((note) => (
                        <tr key={note.id} className="hover:bg-[#EEF4F8]/50 transition-colors">
                          <td className="p-3.5 max-w-xs">
                            <div className="font-bold text-[#151820] truncate">
                              {note.title}
                            </div>
                            <div className="text-[11px] text-[#301934] font-semibold">
                              {note.subject} {note.chapter ? `• ${note.chapter}` : ''}
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-bold bg-[#301934] text-[#F8FAFC] px-2 py-0.5 rounded text-[10px]">
                              {CLASS_CONFIG[note.class_level]?.badge}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-[#151820]/75">
                            <div className="font-medium truncate max-w-[120px]">
                              {note.file_name}
                            </div>
                            <div className="text-[10px] text-[#151820]/50">
                              {formatBytes(note.file_size)}
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap font-semibold text-[#151820]">
                            {note.downloads_count || 0}
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                            <button
                              type="button"
                              onClick={() => setEditingNote(note)}
                              className="p-1.5 text-[#301934] hover:bg-[#DCE5EC] rounded-lg transition-colors cursor-pointer"
                              title="Edit note metadata"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingNote(note)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete note"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* EDIT NOTE MODAL */}
      {editingNote && (
        <div className="fixed inset-0 z-50 bg-[#151820]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#F8FAFC] rounded-3xl border border-[#DCE5EC] shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[#DCE5EC] mb-4">
              <h3 className="font-display font-bold text-lg text-[#301934] flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#F4B942]" />
                Edit Note Details
              </h3>
              <button 
                type="button"
                onClick={() => setEditingNote(null)}
                className="p-1 rounded-full text-[#151820]/50 hover:bg-[#DCE5EC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#301934] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#DCE5EC] text-sm focus:outline-none focus:ring-2 focus:ring-[#301934]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#301934] mb-1">
                    Class
                  </label>
                  <select
                    value={editingNote.class_level}
                    onChange={(e) => setEditingNote({ ...editingNote, class_level: e.target.value as ClassLevel })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#DCE5EC] text-xs focus:outline-none"
                  >
                    <option value="9th">9th Class</option>
                    <option value="10th">10th Class</option>
                    <option value="1st-year">1st Year</option>
                    <option value="2nd-year">2nd Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#301934] mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={editingNote.subject}
                    onChange={(e) => setEditingNote({ ...editingNote, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#DCE5EC] text-xs focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#301934] mb-1">
                  Chapter / Topic
                </label>
                <input
                  type="text"
                  value={editingNote.chapter || ''}
                  onChange={(e) => setEditingNote({ ...editingNote, chapter: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#DCE5EC] text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#301934] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editingNote.description}
                  onChange={(e) => setEditingNote({ ...editingNote, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#DCE5EC] text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE5EC]">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#151820]/75 hover:bg-[#DCE5EC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#301934] text-[#F8FAFC] text-xs font-bold hover:bg-[#48264e]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingNote && (
        <div className="fixed inset-0 z-50 bg-[#151820]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#F8FAFC] rounded-3xl border border-[#DCE5EC] shadow-2xl p-6 overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-display font-bold text-lg text-[#151820] mb-2">
              Permanently Delete Note?
            </h3>
            <p className="text-xs text-[#151820]/75 mb-4 leading-relaxed">
              Are you sure you want to delete <strong className="text-[#301934]">"{deletingNote.title}"</strong>? 
              This will remove the file from server disk storage and student libraries permanently.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DCE5EC]">
              <button
                type="button"
                onClick={() => setDeletingNote(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#151820]/75 hover:bg-[#DCE5EC]"
              >
                Keep Note
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-xs"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
