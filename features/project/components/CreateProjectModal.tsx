'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FolderPlus, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectInput, projectSchema } from '../schema/projectSchema';
import { createProject } from '../actions/projectActions';
import { InputForm } from '@/features/auth/components/InputForm';

export function CreateProjectModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
  });

  const closeModal = () => {
    setIsOpen(false);
    setServerError(null);
    reset();
  };

  const onSubmit = async (data: ProjectInput) => {
    setServerError(null);
    const response = await createProject(data);
    
    if (response?.error) {
      setServerError(response.error);
    } else {
      closeModal();
      toast.success("Proyek berhasil dibuat!");
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
      >
        <FolderPlus size={18} />
        Proyek Baru
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Buat Proyek Baru</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <InputForm
                label="Nama Proyek"
                placeholder="Contoh: Redesain Website, Q3 Marketing"
                {...register('name')}
                error={errors.name?.message}
              />
              
              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FileText size={16} className="text-gray-500" />
                  Deskripsi (Opsional)
                </label>
                <textarea 
                  rows={3}
                  placeholder="Jelaskan secara singkat tujuan proyek ini..."
                  {...register('description')}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none transition-all"
                />
                {errors.description && <span className="text-xs text-red-500 mt-1">{errors.description.message}</span>}
              </div>

              {serverError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {serverError}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-70">
                  {isSubmitting ? 'Menyimpan...' : 'Buat Proyek'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}