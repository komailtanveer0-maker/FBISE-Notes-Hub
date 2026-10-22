import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  BookOpen, 
  Compass, 
  ShieldCheck, 
  Info, 
  Layers, 
  ArrowLeft,
  FileCheck,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { PublicResource, ClassLevel } from '../types/notes';
import { CLASS_CONFIG } from '../utils/notes-logic';

interface PublicResourcesSectionProps {
  onBackToNotes: () => void;
}

export const PublicResourcesSection: React.FC<PublicResourcesSectionProps> = ({ onBackToNotes }) => {
  const [resources, setResources] = useState<PublicResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  useEffect(() => {
    fetch('/api/public-resources')
      .then(res => res.json())
      .then(data => {
        if (data.resources) {
          setResources(data.resources);
        }
      })
      .catch(err => console.error('Error fetching resources:', err))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', 'Curriculum & SLOs', 'Model Papers', 'Official Textbooks', 'Exam Guidelines'];

  const filtered = resources.filter(res => {
    const matchesCat = selectedCategory === 'all' || res.category === selectedCategory;
    const matchesClass = selectedClass === 'all' || res.class_levels.includes(selectedClass as ClassLevel);
    return matchesCat && matchesClass;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <button
            type="button"
            onClick={onBackToNotes}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#301934] hover:text-[#F4B942] transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Teacher-Uploaded Notes</span>
          </button>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#301934]">
            Explore Public FBISE Resources
          </h1>
          <p className="text-sm text-[#151820]/75 mt-1 max-w-2xl">
            Curated index of officially published Federal Board syllabi, model question papers, and national educational initiatives.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToNotes}
          className="px-4 py-2.5 rounded-xl bg-[#301934] text-[#F8FAFC] text-xs font-bold hover:bg-[#48264e] transition-colors cursor-pointer shrink-0"
        >
          Browse Student Notes
        </button>
      </div>

      {/* Honest Public Resource Disclosure Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs leading-relaxed mb-8 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-bold text-amber-900 block">Legitimate Public Domain & Official Links Only</strong>
          <p>
            FBISE Notes Hub does not scrape third-party websites or present unverified materials as official. The links below direct you to publicly published resources hosted by the Federal Board of Intermediate and Secondary Education (FBISE), the National Curriculum Council (NCC), and the Federal Directorate of Education (FDE). Notes uploaded by teachers on this website are authored independently and clearly distinguished.
          </p>
        </div>
      </div>

      {/* Category and Class Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-[#DCE5EC]">
        
        {/* Categories */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#301934] text-[#F8FAFC] shadow-xs'
                  : 'bg-[#EEF4F8] text-[#151820]/75 hover:bg-[#DCE5EC]'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Class Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-[#301934]">Class:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="py-1.5 px-3 rounded-xl bg-[#F8FAFC] border border-[#DCE5EC] font-medium text-xs focus:outline-none"
          >
            <option value="all">All Classes</option>
            <option value="9th">9th Class (SSC-I)</option>
            <option value="10th">10th Class (SSC-II)</option>
            <option value="1st-year">1st Year (HSSC-I)</option>
            <option value="2nd-year">2nd Year (HSSC-II)</option>
          </select>
        </div>

      </div>

      {/* Resources Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(res => (
          <div 
            key={res.id}
            className="bg-[#F8FAFC] border border-[#DCE5EC] rounded-2xl p-6 shadow-xs hover:shadow-lg hover:border-[#301934]/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#DCE5EC] text-[#301934]">
                  {res.category}
                </span>

                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Official Source
                </span>
              </div>

              <h3 className="font-display font-bold text-lg text-[#301934] mb-2">
                {res.title}
              </h3>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#151820]/70 mb-3">
                <Building2 className="w-3.5 h-3.5 text-[#F4B942]" />
                <span>{res.organization}</span>
              </div>

              <p className="text-xs text-[#151820]/75 leading-relaxed mb-4">
                {res.description}
              </p>

              {/* Class tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {res.class_levels.map(cl => (
                  <span key={cl} className="text-[10px] font-medium bg-[#EEF4F8] text-[#301934] px-1.5 py-0.5 rounded">
                    {CLASS_CONFIG[cl]?.badge || cl}
                  </span>
                ))}
              </div>
            </div>

            {/* Direct External Link CTA */}
            <div className="pt-4 border-t border-[#DCE5EC] flex items-center justify-between">
              <span className="text-[11px] text-[#151820]/50 font-medium">
                Verified External Portal
              </span>
              <a
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#301934] hover:text-[#F4B942] transition-colors"
              >
                <span>Visit Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
