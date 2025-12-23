'use client';

import { useTranslations } from 'next-intl';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  type = 'warning'
}: ConfirmModalProps) {
  const t = useTranslations('common');

  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-600',
          hover: 'hover:bg-red-700',
          text: 'text-red-600',
          light: 'bg-red-50',
          border: 'border-red-100'
        };
      case 'info':
        return {
          bg: 'bg-blue-600',
          hover: 'hover:bg-blue-700',
          text: 'text-blue-600',
          light: 'bg-blue-50',
          border: 'border-blue-100'
        };
      default:
        return {
          bg: 'bg-orange-500',
          hover: 'hover:bg-orange-600',
          text: 'text-orange-600',
          light: 'bg-orange-50',
          border: 'border-orange-100'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100] flex items-center justify-center p-4">
      <div className="relative mx-auto p-6 border w-full max-w-sm shadow-xl rounded-2xl bg-white animate-in fade-in zoom-in duration-200">
        <div className="flex items-center mb-4">
          <div className={`p-2 rounded-full ${colors.light} mr-3`}>
            {type === 'danger' ? (
              <svg className={`h-6 w-6 ${colors.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className={`h-6 w-6 ${colors.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-semibold border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {cancelText || t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl ${colors.bg} ${colors.hover} transition-colors shadow-lg shadow-gray-100`}
          >
            {confirmText || t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

