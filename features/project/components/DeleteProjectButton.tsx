'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { deleteProject } from '../actions/projectActions';

interface DeleteProjectButtonProps {
  projectId: number;
  organizationId: number;
  projectTitle: string;
}

export function DeleteProjectButton({ projectId, organizationId, projectTitle }: DeleteProjectButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isMatch = confirmText === projectTitle;

  const handleClose = () => {
    setIsConfirming(false);
    setConfirmText('');
  };

  const handleDelete = async () => {
    if (!isMatch) return;

    setIsLoading(true);
    const res = await deleteProject(projectId, organizationId);

    if (res?.error) {
      toast.error(res.error);
      setIsLoading(false);
    } else {
      handleClose();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsConfirming(true)}
        disabled={isLoading}
        title="Hapus Proyek Permanen"
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-transparent hover:border-red-200 disabled:opacity-50"
      >
        <Trash2 size={16} />
        <span className="hidden sm:inline">{isLoading ? 'Menghapus...' : 'Hapus'}</span>
      </button>

      {isConfirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={22} />
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1.5">
              Hapus proyek secara permanen?
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Semua tugas, checklist, dan komentar di dalam{' '}
              <span className="font-semibold text-gray-700">{projectTitle}</span> akan lenyap
              dan tidak bisa dikembalikan.
            </p>

            <div className="mt-4">
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                Ketik <span className="font-bold text-gray-800">{projectTitle}</span> untuk konfirmasi
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isLoading}
                placeholder={projectTitle}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50"
                autoFocus
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!isMatch || isLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}