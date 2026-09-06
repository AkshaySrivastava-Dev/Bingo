import React from 'react';
import type { ToastMessage } from '../types/game';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
      {toasts.map((toast) => {
        let bg = 'bg-[#1A1D24] border-[#313644] text-[#F4EFE6]';
        let icon = <Info className="w-5 h-5 text-[#F59E0B] shrink-0" />;

        if (toast.type === 'success') {
          bg = 'bg-[#1A1D24] border-emerald-600/50 text-[#F4EFE6]';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        } else if (toast.type === 'error') {
          bg = 'bg-[#1A1D24] border-rose-600/50 text-[#F4EFE6]';
          icon = <AlertCircle className="w-5 h-5 text-[#FB7185] shrink-0" />;
        } else if (toast.type === 'warning') {
          bg = 'bg-[#1A1D24] border-amber-600/50 text-[#F4EFE6]';
          icon = <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-xl transition-all duration-300 ${bg}`}
          >
            <div className="flex items-center gap-2.5">
              {icon}
              <p className="text-sm font-semibold leading-tight">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 text-[#A8A296] hover:text-[#F4EFE6] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

