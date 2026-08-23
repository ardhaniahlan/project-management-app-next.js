'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { removeMember } from '../actions/teamActions';

interface RemoveMemberButtonProps {
  memberId: number;
  memberName: string;
  organizationId: number;
}

export function RemoveMemberButton({ memberId, memberName, organizationId }: RemoveMemberButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRemove = async () => {
    setIsLoading(true);
    const res = await removeMember(organizationId, memberId);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`${memberName} berhasil dikeluarkan dari tim.`);
    }

    setIsLoading(false);
    setIsConfirming(false);
  };

  return (
    <>
      <button
        onClick={() => setIsConfirming(true)}
        disabled={isLoading}
        title="Keluarkan Anggota"
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
      >
        <Trash2 size={18} />
      </button>

      {isConfirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={22} />
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1.5">
              Keluarkan anggota ini?
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              <span className="font-semibold text-gray-700">{memberName}</span> akan dikeluarkan
              dari organisasi ini. Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Mengeluarkan...' : 'Ya, Keluarkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}