import React, { useState } from 'react';
import { 
  Lock, 
  X, 
  KeyRound, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight,
  Info
} from 'lucide-react';

interface TeacherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: { token: string; name: string }) => void;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setErrorMessage('Please enter your secret access code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Secure server-side validation against /api/teacher/auth
      const res = await fetch('/api/teacher/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode.trim() })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Invalid secret access code. Access denied.');
        return;
      }

      // Store token in localStorage for persistence
      localStorage.setItem('fbise_teacher_token', data.session.token);
      localStorage.setItem('fbise_teacher_name', data.session.name);

      onSuccess({
        token: data.session.token,
        name: data.session.name
      });
      onClose();
    } catch (err: any) {
      setErrorMessage('Network error during verification. Please verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#151820]/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="relative w-full max-w-md bg-[#F8FAFC] rounded-3xl border border-[#DCE5EC] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header with Deep Aubergine styling */}
        <div className="bg-gradient-to-br from-[#301934] to-[#1f0f22] p-6 text-[#F8FAFC] relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-[#F8FAFC]/10 hover:bg-[#F8FAFC]/20 text-[#F8FAFC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-[#F4B942]/20 border border-[#F4B942]/40 flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-[#F4B942]" />
          </div>

          <h3 className="font-display font-bold text-2xl text-[#F8FAFC]">
            Teacher Access Portal
          </h3>
          <p className="text-xs text-[#DCE5EC]/80 mt-1">
            Protected workspace for FBISE-affiliated instructors and educators.
          </p>
        </div>

        {/* Content & Form */}
        <div className="p-6">
          
          {/* Security Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#EEF4F8] border border-[#DCE5EC] text-xs text-[#151820]/75 mb-5">
            <ShieldCheck className="w-4 h-4 text-[#301934] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-[#301934] block">Server-Verified Security</span>
              <p>Authentication codes are validated securely on the backend server. No secrets are stored in client-side code.</p>
            </div>
          </div>

          {/* Prototype hint badge */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 mb-5">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              Prototype Access Code: <strong className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-950 font-bold">2580</strong>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="teacher-access-code"
                className="block text-xs font-bold uppercase tracking-wider text-[#301934] mb-1.5"
              >
                Secret Access Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#151820]/40">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="teacher-access-code"
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter secret code..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#DCE5EC] text-[#151820] text-sm focus:outline-none focus:ring-2 focus:ring-[#301934] focus:border-transparent transition-all tracking-wider"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#301934] hover:bg-[#48264e] text-[#F8FAFC] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Enter Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-[#F4B942]" />
                </>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
