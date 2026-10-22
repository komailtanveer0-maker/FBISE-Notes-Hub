import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Calendar, 
  UserCheck, 
  Sparkles, 
  Layers, 
  Tag, 
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  Eye
} from 'lucide-react';
import { Note } from '../types/notes';
import { formatBytes, CLASS_CONFIG } from '../utils/notes-logic';

interface NoteDetailModalProps {
  note: Note | null;
  onClose: () => void;
  onDownload: (note: Note) => void;
}

export const NoteDetailModal: React.FC<NoteDetailModalProps> = ({ note, onClose, onDownload }) => {
  if (!note) return null;

  const [previewError, setPreviewError] = useState(false);
  const classConfig = CLASS_CONFIG[note.class_level];
  const fileUrl = `/api/notes/${note.id}/file`;
  const isPdf = note.file_name.toLowerCase().endsWith('.pdf') || note.file_type.includes('pdf');

  const uploadDate = new Date(note.created_at).toLocaleDateString('en-PK', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#151820]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div 
        className="relative w-full max-w-4xl bg-[#F8FAFC] rounded-2xl sm:rounded-3xl border border-[#DCE5EC] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#301934] to-[#1f0f22] p-5 sm:p-6 text-[#F8FAFC] flex items-start justify-between relative">
          <div className="pr-10">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F4B942] text-[#301934]">
                {classConfig?.badge || note.class_level}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F8FAFC]/20 text-[#F8FAFC] border border-[#F8FAFC]/20">
                {note.subject}
              </span>
              {note.study_group && (
                <span className="text-xs font-medium text-[#DCE5EC]/80 bg-[#151820]/40 px-2 py-0.5 rounded">
                  {note.study_group}
                </span>
              )}
              {note.is_demo ? (
                <span className="text-xs font-medium text-[#F4B942] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Curated FBISE Demo Notes
                </span>
              ) : (
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Verified Teacher Contribution
                </span>
              )}
            </div>

            <h2 className="font-display font-bold text-xl sm:text-2xl text-[#F8FAFC] leading-snug">
              {note.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-[#F8FAFC]/10 hover:bg-[#F8FAFC]/20 text-[#F8FAFC] transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Two Columns */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#EEF4F8] p-4 rounded-xl border border-[#DCE5EC]">
            <div>
              <span className="text-[11px] font-semibold text-[#151820]/60 uppercase tracking-wider block">
                Class Level
              </span>
              <span className="text-sm font-bold text-[#301934]">
                {classConfig?.name.split('(')[0] || note.class_level}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#151820]/60 uppercase tracking-wider block">
                Subject & Chapter
              </span>
              <span className="text-sm font-bold text-[#301934] truncate block">
                {note.subject} {note.chapter ? `• ${note.chapter}` : ''}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#151820]/60 uppercase tracking-wider block">
                Format & Size
              </span>
              <span className="text-sm font-bold text-[#301934]">
                {isPdf ? 'PDF Document' : note.file_name.split('.').pop()?.toUpperCase()} • {formatBytes(note.file_size)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#151820]/60 uppercase tracking-wider block">
                Uploaded On
              </span>
              <span className="text-sm font-bold text-[#301934]">
                {uploadDate}
              </span>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#301934] mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#F4B942]" />
              Study Content & FBISE Learning Outcomes
            </h4>
            <div className="bg-[#F8FAFC] border border-[#DCE5EC] rounded-xl p-4 text-sm text-[#151820] leading-relaxed whitespace-pre-line">
              {note.description}
            </div>
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-[#151820]/70 mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#301934]" />
                Curriculum Keywords & Syllabus Tags:
              </h5>
              <div className="flex flex-wrap gap-2">
                {note.tags.map(t => (
                  <span 
                    key={t}
                    className="text-xs font-medium bg-[#DCE5EC]/60 text-[#301934] px-2.5 py-1 rounded-lg border border-[#DCE5EC]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Document / PDF Previewer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#301934] flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#F4B942]" />
                Document Live Preview
              </h4>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#301934] hover:text-[#F4B942] flex items-center gap-1 transition-colors"
              >
                <span>Open in Fullscreen</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {isPdf ? (
              <div className="w-full h-80 sm:h-96 rounded-xl border border-[#DCE5EC] overflow-hidden bg-slate-100 flex items-center justify-center">
                <iframe
                  src={`${fileUrl}#toolbar=0&navpanes=0`}
                  title={`Preview of ${note.title}`}
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="w-full p-8 rounded-xl border border-[#DCE5EC] bg-[#EEF4F8] text-center">
                <FileText className="w-12 h-12 text-[#301934]/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#301934]">
                  {note.file_name}
                </p>
                <p className="text-xs text-[#151820]/60 mt-1 mb-4">
                  Direct interactive inline preview is optimized for PDF formats. Click below to download and open this document on your device.
                </p>
                <button
                  type="button"
                  onClick={() => onDownload(note)}
                  className="inline-flex items-center gap-2 bg-[#301934] text-[#F8FAFC] font-semibold text-xs px-4 py-2 rounded-xl hover:bg-[#48264e] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download File
                </button>
              </div>
            )}
          </div>

          {/* Teacher accreditation */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-950">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Contributor: </span>
              {note.teacher_name || 'Verified FBISE Educator'}
              <span className="text-amber-800 ml-1">
                (Verified study resource adhering to Federal Board standards)
              </span>
            </div>
          </div>

        </div>

        {/* Modal Footer with Action Buttons */}
        <div className="bg-[#EEF4F8] px-5 sm:px-6 py-4 border-t border-[#DCE5EC] flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-[#151820]/60">
            Total downloads: <strong className="text-[#301934]">{note.downloads_count || 0}</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#151820]/80 hover:bg-[#DCE5EC] transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onDownload(note)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#F4B942] hover:bg-[#e5a72f] text-[#301934] shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Full Note ({formatBytes(note.file_size)})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
