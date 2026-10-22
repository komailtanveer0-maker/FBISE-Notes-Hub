import React from 'react';
import { GraduationCap, Mail, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import { ClassLevel } from '../types/notes';

interface FooterProps {
  onNavigate: (view: string, params?: { classLevel?: ClassLevel }) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#301934] text-[#F8FAFC] border-t border-[#F4B942]/20 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#DCE5EC]/15">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F4B942] text-[#301934] flex items-center justify-center font-bold">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="font-display font-bold text-xl text-[#F8FAFC]">
                  FBISE <span className="text-[#F4B942]">Notes Hub</span>
                </span>
                <span className="block text-[11px] text-[#DCE5EC]/70">
                  Federal Board Academic Portal
                </span>
              </div>
            </div>

            <p className="text-xs text-[#DCE5EC]/80 leading-relaxed">
              Empowering students and educators across Pakistan under the Federal Board of Intermediate and Secondary Education with peer-reviewed notes, SLOs, and model paper solutions.
            </p>

            <div className="flex items-center gap-2 text-xs text-[#F4B942]">
              <ShieldCheck className="w-4 h-4" />
              <span>Independent Educational Resource</span>
            </div>
          </div>

          {/* Quick Classes */}
          <div>
            <h4 className="font-display font-bold text-sm text-[#F4B942] uppercase tracking-wider mb-4">
              Browse Classes
            </h4>
            <ul className="space-y-2 text-xs text-[#DCE5EC]/80">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('class', { classLevel: '9th' })}
                  className="hover:text-[#F4B942] transition-colors cursor-pointer"
                >
                  9th Class (SSC Part I)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('class', { classLevel: '10th' })}
                  className="hover:text-[#F4B942] transition-colors cursor-pointer"
                >
                  10th Class (SSC Part II)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('class', { classLevel: '1st-year' })}
                  className="hover:text-[#F4B942] transition-colors cursor-pointer"
                >
                  1st Year (HSSC Part I - 11th)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('class', { classLevel: '2nd-year' })}
                  className="hover:text-[#F4B942] transition-colors cursor-pointer"
                >
                  2nd Year (HSSC Part II - 12th)
                </button>
              </li>
            </ul>
          </div>

          {/* Academic Portals */}
          <div>
            <h4 className="font-display font-bold text-sm text-[#F4B942] uppercase tracking-wider mb-4">
              Resources & Tools
            </h4>
            <ul className="space-y-2 text-xs text-[#DCE5EC]/80">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('student')}
                  className="hover:text-[#F4B942] transition-colors cursor-pointer"
                >
                  Student Search Portal
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('notes')}
                  className="hover:text-[#F4B942] transition-colors cursor-pointer"
                >
                  All Notes Library
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('resources')}
                  className="hover:text-[#F4B942] transition-colors cursor-pointer"
                >
                  Official Public Resources
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('teacher-login')}
                  className="hover:text-[#F4B942] transition-colors cursor-pointer"
                >
                  Teacher Access Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Institutional / Contact */}
          <div>
            <h4 className="font-display font-bold text-sm text-[#F4B942] uppercase tracking-wider mb-4">
              Federal Board Hub
            </h4>
            <div className="space-y-3 text-xs text-[#DCE5EC]/80">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#F4B942] shrink-0 mt-0.5" />
                <span>Sector H-8/4, Islamabad, Federal Capital Territory, Pakistan</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F4B942] shrink-0" />
                <span>educator-support@fbiserevision.org</span>
              </div>
              <div className="pt-2 text-[11px] text-[#DCE5EC]/60">
                Created to assist high-school and college scholars preparing for annual FBISE board examinations.
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Legal bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#DCE5EC]/60 gap-4">
          <div>
            © {new Date().getFullYear()} FBISE Notes Hub. All educational rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-[#F4B942] cursor-pointer">About FBISE</span>
            <span className="hover:text-[#F4B942] cursor-pointer">Academic Guidelines</span>
            <span className="hover:text-[#F4B942] cursor-pointer">Privacy Policy</span>
            <span className="hover:text-[#F4B942] cursor-pointer">Terms of Service</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
