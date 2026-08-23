'use client';

import { useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { updateProjectStatus } from '../actions/projectActions';

interface ProjectStatusButtonProps {
  projectId: number;
  organizationId: number;
  currentStatus: string;
}

export function ProjectStatusButton({ projectId, organizationId, currentStatus }: ProjectStatusButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isCompleted = currentStatus === 'completed';

  const handleToggleStatus = async () => {
    setIsLoading(true);
    const newStatus = isCompleted ? 'active' : 'completed';
    
    const res = await updateProjectStatus(projectId, newStatus, organizationId);
    
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(isCompleted ? 'Proyek dibuka kembali!' : 'Hore! Proyek diselesaikan!');
    }
    setIsLoading(false);
  };

  return (
    <button
      onClick={handleToggleStatus}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors border shadow-sm disabled:opacity-50
        ${isCompleted 
          ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50' 
          : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
        }`}
    >
      {isCompleted ? <RotateCcw size={16} /> : <CheckCircle2 size={16} />}
      {isLoading ? 'Memproses...' : isCompleted ? 'Buka Kembali Proyek' : 'Selesaikan Proyek'}
    </button>
  );
}