import React from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  UserCheck, 
  CheckCircle2, 
  Sparkles, 
  BookmarkCheck,
  Tag
} from 'lucide-react';
import { Note } from '../types/notes';
import { formatBytes, CLASS_CONFIG } from '../utils/notes-logic';

interface NoteCardProps {
  note: Note;
  onPreview: (note: Note) => void;
  onDownload: (note: Note) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPreview, onDownload }) => {
  const classBadge = CLASS_CONFIG[note.class_level]?.badge || note.class_level;
  const isPdf = note.file_name.toLowerCase().endsWith('.pdf') || note.file_type.includes('pdf');
  const dateFormatted = new Date(note.created_at).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="group relative rounded-2xl bg-[#F8FAFC] border border-[#DCE5EC] p-6 shadow-xs hover:shadow-xl hover:border-[#301934]/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#301934] via-[#F4B942] to-[#301934] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div>
        {/* Badges Bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#301934] text-[#F8FAFC]">
              {classBadge}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#DCE5EC] text-[#301934]">
              {note.subject}
            </span>
            {note.chapter && (
              <span className="text-[11px] font-medium text-[#151820]/70 bg-[#EEF4F8] px-2 py-0.5 rounded border border-[#DCE5EC] hidden sm:inline-block">
                {note.chapter}
              </span>
            )}
          </div>

          {/* Verification Source Indicator */}
          {note.is_demo ? (
            <span 
              className="text-[10px] font-semibold text-[#151820]/60 bg-[#DCE5EC]/70 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"
              title="Curated FBISE demonstration study material"
            >
              <Sparkles className="w-3 h-3 text-[#F4B942]" />
              Curated Demo
            </span>
          ) : (
            <span 
              className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"
              title="Uploaded and reviewed by verified institutional educator"
            >
              <UserCheck className="w-3 h-3 text-emerald-600" />
              Teacher Upload
            </span>
          )}
        </div>

        {/* Note Title */}
        <h4 
          onClick={() => onPreview(note)}
          className="font-display font-bold text-lg text-[#301934] hover:text-[#e5a72f] cursor-pointer transition-colors line-clamp-2 mb-2"
          title={note.title}
        >
          {note.title}
        </h4>

        {/* Description snippet */}
        <p className="text-xs text-[#151820]/75 leading-relaxed line-clamp-3 mb-4">
          {note.description}
        </p>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {note.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag}
                className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-[#EEF4F8] text-[#151820]/60 px-1.5 py-0.5 rounded border border-[#DCE5EC]/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Note Meta & Actions */}
      <div>
        <div className="pt-3 border-t border-[#DCE5EC]/80 flex items-center justify-between text-[11px] text-[#151820]/60 mb-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-[#301934]">
              <FileText className="w-3.5 h-3.5 text-[#F4B942]" />
              {isPdf ? 'PDF' : 'DOC'} • {formatBytes(note.file_size)}
            </span>
            <span className="flex items-center gap-1 hidden sm:flex">
              <Calendar className="w-3 h-3" />
              {dateFormatted}
            </span>
          </div>

          <span className="font-medium text-[#151820]/60">
            {note.downloads_count || 0} downloads
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onPreview(note)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border border-[#301934]/20 text-[#301934] hover:bg-[#301934] hover:text-[#F8FAFC] transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={() => onDownload(note)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-[#F4B942] hover:bg-[#e5a72f] text-[#301934] shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

    </div>
  );
};
