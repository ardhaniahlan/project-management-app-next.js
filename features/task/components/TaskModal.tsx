"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Trash2,
  AlignLeft,
  Flag,
  Calendar,
  Save,
  Plus,
  Type,
  ChevronDown,
  Pencil,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { TaskInput, taskSchema } from "../schema/taskSchema";
import {
  createTask,
  deleteTask,
  getOrganizationMembers,
  updateTask,
} from "../actions/taskActions";
import { Task } from "../types/task.types";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  projectId: number;
  boardId: number;
  task: Task | null;
  userRole: string;
}

const priorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-rose-50 text-rose-600";
    case "medium":
      return "bg-amber-50 text-amber-600";
    default:
      return "bg-emerald-50 text-emerald-600";
  }
};

export function TaskModal({
  isOpen,
  onClose,
  mode,
  projectId,
  boardId,
  task,
  userRole,
}: TaskModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [view, setView] = useState<"detail" | "form">(
    mode === "create" ? "form" : "detail",
  );
  const [members, setMembers] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
  });

  useEffect(() => {
    if (isOpen) {
      const fetchMembers = async () => {
        const res = await getOrganizationMembers(projectId);
        if (res.members) setMembers(res.members);
      };
      fetchMembers();
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
      setView(mode === "create" ? "form" : "detail");
      if (mode === "edit" && task) {
        const formattedDate = task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]
          : "";
        reset({
          title: task.title,
          description: task.description || "",
          priority: task.priority as any,
          dueDate: formattedDate,
          projectId,
          boardId: task.boardId,
          assigneeIds: task.assignees?.map((a) => String(a.userId)) || [],
        });
      } else {
        reset({
          title: "",
          description: "",
          priority: "medium",
          dueDate: "",
          projectId,
          boardId,
          assigneeIds: [],
        });
      }
    }
  }, [isOpen, mode, task, boardId, projectId, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: TaskInput) => {
    if (mode === "create") {
      const res = await createTask(data);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Tugas dibuat!");
        onClose();
      }
    } else if (mode === "edit" && task) {
      const numericAssigneeIds = data.assigneeIds?.map(Number) || [];
      const res = await updateTask(task.id, projectId, {
        ...data,
        assigneeIds: numericAssigneeIds
      });
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Tugas diperbarui!");
        onClose();
      }
    }
  };

  const handleDelete = async () => {
    if (task) {
      const res = await deleteTask(task.id, projectId);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Tugas dihapus!");
        onClose();
      }
    }
  };

  const handleCancelForm = () => {
    if (mode === "edit" && task) {
      setView("detail");
    } else {
      onClose();
    }
  };

  const formattedDueDate = task?.dueDate
    ? new Date(task.dueDate).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {isDeleting
              ? "Hapus Tugas"
              : mode === "create"
                ? "Buat Tugas Baru"
                : view === "detail"
                  ? "Detail Tugas"
                  : "Edit Tugas"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {isDeleting ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Hapus tugas ini?
            </h3>
            <p className="text-gray-500 mb-6">
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsDeleting(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        ) : view === "detail" && task ? (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${priorityBadge(task.priority)}`}
              >
                {task.priority}
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 leading-snug mb-4">
              {task.title}
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <AlignLeft size={13} /> Deskripsi
                </p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {task.description || (
                    <span className="text-gray-400 italic">
                      Tidak ada deskripsi.
                    </span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} /> Tenggat Waktu
                </p>
                <p className="text-sm text-gray-700">
                  {formattedDueDate || (
                    <span className="text-gray-400 italic">
                      Tidak ada tenggat waktu.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="pt-6 flex gap-3">
              {mode === "edit" && userRole !== "member" && !isDeleting && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsDeleting(true)}
                    className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={17} />
                    Hapus
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("form")}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Pencil size={17} />
                    Edit Tugas
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Type size={16} className="text-gray-500" /> Judul Tugas
              </label>
              <input
                {...register("title")}
                placeholder="Contoh: Buat desain logo..."
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-semibold"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <AlignLeft size={16} className="text-gray-500" /> Deskripsi
              </label>
              <textarea
                rows={4}
                {...register("description")}
                placeholder="Detail tambahan..."
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><User size={16} /> Ditugaskan Kepada</label>
              <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
                {members.length === 0 && <span className="text-xs text-gray-400">Tidak ada anggota tersedia</span>}
                {members.map((member) => (
                  <label key={member.userId} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
                    <input 
                      type="checkbox" 
                      value={member.userId}
                      disabled={userRole === 'member'}
                      {...register('assigneeIds')} // <-- Akan otomatis mengirim array ID
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50"
                    />
                    {member.name || `User ID: ${member.userId}`}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Flag size={16} className="text-gray-500" /> Prioritas
                </label>
                <div className="relative">
                  <select
                    {...register("priority")}
                    className="w-full appearance-none px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Calendar size={16} className="text-gray-500" /> Tenggat Waktu
                </label>
                <input
                  type="date"
                  {...register("dueDate")}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                {userRole === "member" ? "Tutup" : "Batal"}
              </button>

              {userRole !== "member" && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  {mode === "create" ? <Plus size={18} /> : <Save size={18} />}
                  {isSubmitting
                    ? "Menyimpan..."
                    : mode === "create"
                      ? "Buat Tugas"
                      : "Simpan Perubahan"}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
