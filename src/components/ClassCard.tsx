import React from 'react';
import { BookMarked, ArrowRight, Sparkles, Layers } from 'lucide-react';
import { ClassLevel } from '../types/notes';
import { CLASS_CONFIG } from '../utils/notes-logic';

interface ClassCardProps {
  level: ClassLevel;
  notesCount: number;
  onSelect: (level: ClassLevel) => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({ level, notesCount, onSelect }) => {
  const config = CLASS_CONFIG[level];

  // Colors and visual accents according to level
  const isHSSC = level === '1st-year' || level === '2nd-year';

  return (
    <div 
      onClick={() => onSelect(level)}
      className="group relative cursor-pointer rounded-2xl bg-gradient-to-b from-[#F8FAFC] to-[#EEF4F8] p-6 sm:p-7 border border-[#DCE5EC] shadow-sm hover:shadow-xl hover:border-[#301934]/30 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
    >
      {/* Decorative ambient gradient backdrop */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4B942]/10 rounded-full blur-2xl group-hover:bg-[#F4B942]/20 transition-colors pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[#301934]/5 rounded-full blur-xl pointer-events-none" />

      <div>
        {/* Top Header Tag */}
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-[#301934] text-[#F8FAFC]">
            <Layers className="w-3.5 h-3.5 text-[#F4B942]" />
            <span>{config.badge}</span>
          </span>
          <span className="text-xs font-semibold text-[#151820]/60 bg-[#DCE5EC]/60 px-2 py-0.5 rounded-full">
            {notesCount} {notesCount === 1 ? 'Note' : 'Notes'}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-xl sm:text-2xl text-[#301934] group-hover:text-[#48264e] transition-colors mb-2">
          {config.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-[#151820]/75 leading-relaxed mb-5">
          {config.description}
        </p>

        {/* Key Subjects Badges */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {config.defaultSubjects.slice(0, 4).map((sub) => (
            <span 
              key={sub}
              className="text-[11px] font-medium bg-[#DCE5EC]/50 text-[#151820]/80 px-2 py-0.5 rounded-md border border-[#DCE5EC]"
            >
              {sub}
            </span>
          ))}
          {config.defaultSubjects.length > 4 && (
            <span className="text-[11px] font-medium text-[#151820]/50 px-1 py-0.5">
              +{config.defaultSubjects.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-4 border-t border-[#DCE5EC]/80 flex items-center justify-between">
        <span className="text-xs font-bold text-[#301934] group-hover:text-[#F4B942] transition-colors flex items-center gap-1">
          Explore Class Notes
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </span>
        <div className="w-7 h-7 rounded-full bg-[#DCE5EC]/60 group-hover:bg-[#F4B942] group-hover:text-[#301934] text-[#151820]/60 flex items-center justify-center transition-all">
          <BookMarked className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
