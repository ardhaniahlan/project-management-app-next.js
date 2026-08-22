'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X, AlignLeft, Flag, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { createTask } from '../actions/taskActions';
import { TaskInput, taskSchema } from '../schema/taskSchema';
import { InputForm } from '@/features/auth/components/InputForm';

interface CreateTaskModalProps {
  projectId: number;
  boardId: number;
}

export function CreateTaskModal({ projectId, boardId }: CreateTaskModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      projectId: projectId,
      boardId: boardId,
      priority: 'medium',
    }
  });

  const closeModal = () => {
    setIsOpen(false);
    setServerError(null);
    reset();
  };

  const onSubmit = async (data: TaskInput) => {
    setServerError(null);
    const response = await createTask(data);
    
    if (response?.error) {
      setServerError(response.error);
    } else {
      closeModal();
      toast.success("Tugas berhasil ditambahkan!");
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="mt-3 w-full py-2 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold rounded-xl border border-gray-200/80 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
      >
        <Plus size={14} />
        Tambah Tugas
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Buat Tugas Baru</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <InputForm
                label="Judul Tugas"
                placeholder="Contoh: Buat desain logo..."
                {...register('title')}
                error={errors.title?.message}
              />
              
              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <AlignLeft size={16} className="text-gray-500" />
                  Deskripsi (Opsional)
                </label>
                <textarea 
                  rows={3}
                  placeholder="Detail tambahan mengenai tugas ini..."
                  {...register('description')}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Flag size={16} className="text-gray-500" />
                    Prioritas
                  </label>
                  <select 
                    {...register('priority')}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 appearance-none"
                  >
                    <option value="low">Rendah (Low)</option>
                    <option value="medium">Sedang (Medium)</option>
                    <option value="high">Tinggi (High)</option>
                  </select>
                  {errors.priority && <span className="text-xs text-red-500 mt-1">{errors.priority.message}</span>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    Tenggat Waktu
                  </label>
                  <input 
                    type="date"
                    {...register('dueDate')}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
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
                  {isSubmitting ? 'Menyimpan...' : 'Buat Tugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}