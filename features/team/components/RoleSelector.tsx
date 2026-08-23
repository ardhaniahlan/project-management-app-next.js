'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { updateMemberRole } from '../actions/teamActions';

interface RoleSelectorProps {
  memberId: number;
  currentRole: string;
  organizationId: number;
  isOwner: boolean;
  isSelf: boolean;
}

const roleLabel = (role: string) => role.replace('_', ' ');

export function RoleSelector({ memberId, currentRole, organizationId, isOwner, isSelf }: RoleSelectorProps) {
  const [role, setRole] = useState(currentRole);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    if (newRole === role) return;
    setPendingRole(newRole);
  };

  const handleCancel = () => {
    setPendingRole(null);
  };

  const handleConfirm = async () => {
    if (!pendingRole) return;
    setIsLoading(true);

    const res = await updateMemberRole(organizationId, memberId, pendingRole);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success('Peran berhasil diperbarui!');
      setRole(pendingRole);
    }

    setIsLoading(false);
    setPendingRole(null);
  };

  const badgeClass = `px-3 py-1 rounded-full text-xs font-medium capitalize border border-transparent ${
    role === 'owner' ? 'bg-purple-100 text-purple-700' :
    role === 'project_manager' ? 'bg-blue-100 text-blue-700' :
    'bg-gray-100 text-gray-700'
  }`;

  if (!isOwner || isSelf) {
    return (
      <span className={badgeClass}>
        {roleLabel(role)}
      </span>
    );
  }

  return (
    <>
      <div className="relative inline-block">
        <select
          value={role}
          onChange={handleSelectChange}
          disabled={isLoading}
          className={`${badgeClass} appearance-none pr-7 cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 outline-none`}
        >
          <option value="owner" className="bg-white text-gray-900">Owner</option>
          <option value="project_manager" className="bg-white text-gray-900">Project Manager</option>
          <option value="member" className="bg-white text-gray-900">Member</option>
        </select>
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-current opacity-70">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>

      {pendingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={22} />
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1.5">
              Ubah peran anggota?
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Peran akan diubah dari{' '}
              <span className="font-semibold text-gray-700 capitalize">{roleLabel(role)}</span>
              {' '}menjadi{' '}
              <span className="font-semibold text-gray-700 capitalize">{roleLabel(pendingRole)}</span>.
              Perubahan ini akan mempengaruhi akses anggota ke ruang kerja.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Menyimpan...' : 'Ya, Ubah'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}