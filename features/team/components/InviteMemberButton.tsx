'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, X, Mail, Shield, Search } from 'lucide-react';
import { toast } from 'sonner';
import { InviteInput, inviteSchema } from '../schema/teamSchema';
import { inviteUserToTeam, searchUsersForInvite } from '../actions/teamActions';
import { InputForm } from '@/features/auth/components/InputForm';

type SearchResult = { id: number; name: string; email: string };

export function InviteMemberButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'member' }
  });

  const emailValue = watch('email');

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (showDropdown && emailValue && emailValue.length >= 2) {
        setIsSearching(true);
        const results = await searchUsersForInvite(emailValue);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [emailValue, showDropdown]);

  const closeModal = () => {
    setIsOpen(false);
    setServerError(null);
    setShowDropdown(false);
    reset();
  };

  const onSubmit = async (data: InviteInput) => {
    setServerError(null);
    const response = await inviteUserToTeam(data); 
    
    if (response?.error) {
      setServerError(response.error);
    } else {
      closeModal();
      toast.success("Anggota berhasil ditambahkan!"); 
    }
  };

  const handleSelectUser = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setShowDropdown(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm">
        <UserPlus size={18} />
        Undang Anggota
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Undang ke Tim</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              
              <div className="relative">
                <InputForm
                  label="Email Anggota (Cari/Ketik)"
                  icon={<Search size={18} />}
                  type="text"
                  autoComplete="off"
                  placeholder="Ketik nama atau email..."
                  {...register('email')}
                  onChange={(e) => {
                    setValue('email', e.target.value, { shouldValidate: true });
                    setShowDropdown(true);
                  }}
                  error={errors.email?.message}
                />
                
                {showDropdown && emailValue?.length >= 2 && (
                  <div className="absolute top-18 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center text-sm text-gray-500">Mencari...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleSelectUser(user.email)}
                          className="px-4 py-3 cursor-pointer hover:bg-indigo-50 border-b border-gray-50 last:border-0 flex justify-between items-center transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                            <span className="text-xs text-gray-500">{user.email}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">Pengguna tidak ditemukan</div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-1.5 mb-4">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="text-gray-500 w-4 h-4"><Shield size={16}/></span>
                  Peran (Role)
                </label>
                <select 
                  {...register('role')}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="member">Member (Akses Standar)</option>
                  <option value="project_manager">Project Manager</option>
                </select>
                {errors.role && <span className="text-xs text-red-500 mt-1">{errors.role.message}</span>}
              </div>

              {serverError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {serverError}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-70">
                  {isSubmitting ? 'Mengirim...' : 'Kirim Undangan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}