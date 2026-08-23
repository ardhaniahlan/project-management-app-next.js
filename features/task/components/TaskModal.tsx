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
  CheckSquare,
  Send,
  MessageSquare,
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
import {
  addChecklist,
  deleteChecklist,
  toggleChecklist,
} from "../actions/checklistActions";
import {
  addTaskComment,
  getCommentsByTaskId,
} from "@/features/comment/actions/commentActions";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  projectId: number;
  boardId: number;
  task: Task | null;
  userRole: string;
  isReadOnly?: boolean;
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
  isReadOnly,
}: TaskModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [view, setView] = useState<"detail" | "form">(
    mode === "create" ? "form" : "detail",
  );
  const [members, setMembers] = useState<any[]>([]);

  const [newChecklist, setNewChecklist] = useState("");
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);

  const [pendingChecklists, setPendingChecklists] = useState<string[]>([]);
  const [pendingInput, setPendingInput] = useState("");

  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

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
    if (isOpen && view === "detail" && task) {
      const fetchComments = async () => {
        setIsLoadingComments(true);
        const res = await getCommentsByTaskId(task.id);
        if (res.success && res.data) {
          setComments(res.data);
        }
        setIsLoadingComments(false);
      };
      fetchComments();
    }
  }, [isOpen, view, task]);

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
          checklists: task.checklists?.map((c) => c.title) || [],
        });
      } else {
        setPendingChecklists([]);
        setPendingInput("");
        reset({
          title: "",
          description: "",
          priority: "medium",
          dueDate: "",
          projectId,
          boardId,
          assigneeIds: [],
          checklists: [],
        });
      }
    }
  }, [isOpen, mode, task, boardId, projectId, reset]);

  if (!isOpen) return null;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !task) return;

    setIsSubmittingComment(true);
    const res = await addTaskComment(task.id, newComment, projectId);

    if (res?.error) {
      toast.error(res.error);
    } else {
      setNewComment("");
      const refreshRes = await getCommentsByTaskId(task.id);
      if (refreshRes.success && refreshRes.data) setComments(refreshRes.data);
    }
    setIsSubmittingComment(false);
  };

  const handleAddChecklist = async () => {
    if (!newChecklist.trim() || !task) return;
    setIsLoadingChecklist(true);
    const res = await addChecklist(task.id, newChecklist, projectId);
    if (res?.error) toast.error(res.error);
    else setNewChecklist("");
    setIsLoadingChecklist(false);
  };

  const handleToggleChecklist = async (
    checklistId: number,
    currentStatus: boolean,
  ) => {
    await toggleChecklist(checklistId, !currentStatus, projectId);
  };

  const handleDeleteChecklist = async (checklistId: number) => {
    await deleteChecklist(checklistId, projectId);
  };

  const onSubmit = async (data: TaskInput) => {
    if (mode === "create") {
      const payload = { ...data, checklists: pendingChecklists };
      const res = await createTask(payload);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Tugas dibuat!");
        onClose();
      }
    } else if (mode === "edit" && task) {
      const numericAssigneeIds = data.assigneeIds?.map(Number) || [];
      const res = await updateTask(task.id, projectId, {
        ...data,
        assigneeIds: numericAssigneeIds,
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
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
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
          <div className="p-8 text-center overflow-y-auto">
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
          <>
            <div className="p-6 overflow-y-auto flex-1">
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

                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <CheckSquare size={13} /> Checklist
                  </p>

                  <div className="space-y-2">
                    {task.checklists && task.checklists.length > 0 ? (
                      task.checklists.map((checklist) => (
                        <div
                          key={checklist.id}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={checklist.isCompleted}
                            onChange={() =>
                              !isReadOnly &&
                              handleToggleChecklist(
                                checklist.id,
                                checklist.isCompleted,
                              )
                            }
                            disabled={isReadOnly}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50"
                          />
                          <span
                            className={`text-sm ${checklist.isCompleted ? "text-gray-400 line-through" : "text-gray-700"}`}
                          >
                            {checklist.title}
                          </span>
                          {userRole !== "member" && !isReadOnly && (
                            <button
                              onClick={() =>
                                handleDeleteChecklist(checklist.id)
                              }
                              className="ml-auto text-gray-400 hover:text-red-600"
                              title="Hapus item"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        Belum ada checklist.
                      </p>
                    )}
                  </div>

                  {userRole !== "member" && !isReadOnly && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={newChecklist}
                        onChange={(e) => setNewChecklist(e.target.value)}
                        placeholder="Tambah item baru..."
                        disabled={isDeleting || isSubmitting}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                      />
                      <button
                        onClick={handleAddChecklist}
                        disabled={!newChecklist.trim() || isLoadingChecklist}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        {isLoadingChecklist ? "Menyimpan..." : "Tambah"}
                      </button>
                    </div>
                  )}
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

              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                  <MessageSquare size={13} /> Komentar Tim ({comments.length})
                </p>

                {!isReadOnly && (
                  <form
                    onSubmit={handleSubmitComment}
                    className="mb-6 flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <User size={14} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Tulis komentar..."
                        disabled={isSubmittingComment}
                        className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim() || isSubmittingComment}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 text-sm font-medium"
                      >
                        {isSubmittingComment ? (
                          "..."
                        ) : (
                          <>
                            <Send size={14} /> Kirim
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {isLoadingComments ? (
                    <p className="text-sm text-gray-400 text-center py-2">
                      Memuat komentar...
                    </p>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-4 bg-gray-50 rounded-lg border border-gray-100 border-dashed">
                      Belum ada diskusi di tugas ini.
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                          {comment.user.name
                            ? comment.user.name.charAt(0)
                            : "U"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-gray-900 text-sm">
                              {comment.user.name}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {new Date(comment.createdAt).toLocaleDateString(
                                "id-ID",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-tr-lg rounded-b-lg border border-gray-100">
                            {comment.body}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {mode === "edit" &&
              userRole !== "member" &&
              !isDeleting &&
              !isReadOnly && (
                <div className="p-6 pt-4 border-t border-gray-100 flex gap-3 shrink-0">
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
                </div>
              )}
          </>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
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

              {mode === "create" && (
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200 border-dashed">
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <CheckSquare size={16} className="text-gray-500" /> Item
                    Checklist (Opsional)
                  </label>

                  {pendingChecklists.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {pendingChecklists.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm"
                        >
                          <span className="text-gray-700">{item}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingChecklists((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pendingInput}
                      onChange={(e) => setPendingInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (pendingInput.trim()) {
                            setPendingChecklists((prev) => [
                              ...prev,
                              pendingInput.trim(),
                            ]);
                            setPendingInput("");
                          }
                        }
                      }}
                      placeholder="Ketik lalu tekan Enter..."
                      className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                    <button
                      type="button"
                      disabled={!pendingInput.trim()}
                      onClick={() => {
                        setPendingChecklists((prev) => [
                          ...prev,
                          pendingInput.trim(),
                        ]);
                        setPendingInput("");
                      }}
                      className="px-3 py-2 bg-indigo-100 text-indigo-700 font-medium text-sm rounded-lg hover:bg-indigo-200 disabled:opacity-50 transition-colors"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User size={16} /> Ditugaskan Kepada
                </label>
                <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
                  {members.length === 0 && (
                    <span className="text-xs text-gray-400">
                      Tidak ada anggota tersedia
                    </span>
                  )}
                  {members.map((member) => (
                    <label
                      key={member.userId}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        value={member.userId}
                        disabled={userRole === "member"}
                        {...register("assigneeIds")}
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
                    <Calendar size={16} className="text-gray-500" /> Tenggat
                    Waktu
                  </label>
                  <input
                    type="date"
                    {...register("dueDate")}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 pt-4 border-t border-gray-100 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={handleCancelForm}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                {userRole === "member" ? "Tutup" : "Batal"}
              </button>

              {userRole !== "member" && !isReadOnly && (
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
