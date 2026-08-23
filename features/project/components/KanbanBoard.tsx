"use client";

import { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { moveTask } from "@/features/task/actions/taskActions";
import { toast } from "sonner";
import { TaskModal } from "@/features/task/components/TaskModal";
import { Plus, CheckSquare, Search, Filter, Inbox, MessageSquare } from "lucide-react";
import { Task } from "@/features/task/types/task.types";
import useDebounce from "@/hooks/useDebounce";

type Board = { id: number; name: string; position: number };

interface KanbanBoardProps {
  projectId: number;
  boards: Board[];
  initialTasks: Task[];
  userRole: string;
  isReadOnly?: boolean;
}

const statusDotColor = (boardName: string) => {
  const name = boardName.toLowerCase();
  if (name === "done") return "bg-indigo-400";
  if (name === "in progress") return "bg-orange-400";
  return "bg-gray-400";
};

const priorityAccent = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-rose-50 text-rose-600";
    case "medium":
      return "bg-amber-50 text-amber-600";
    default:
      return "bg-emerald-50 text-emerald-600";
  }
};

export function KanbanBoard({
  projectId,
  boards,
  initialTasks,
  userRole,
  isReadOnly = false,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [isMounted, setIsMounted] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    boardId: number;
    task: Task | null;
  }>({
    isOpen: false,
    mode: "create",
    boardId: 0,
    task: null,
  });

  useEffect(() => {
    setIsMounted(true);
    setTasks(initialTasks);

    setModalState((prev) => {
      if (prev.isOpen && prev.task) {
        const updatedTask = initialTasks.find((t) => t.id === prev.task!.id);
        if (updatedTask) return { ...prev, task: updatedTask };
      }
      return prev;
    });
  }, [initialTasks]);

  const onDragEnd = async (result: DropResult) => {
    if (isReadOnly) {
      toast.info("Proyek ini sudah selesai dan tidak dapat diubah.");
      return;
    }

    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const taskId = parseInt(draggableId);
    const newBoardId = parseInt(destination.droppableId);

    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, boardId: newBoardId } : t)),
    );

    const res = await moveTask(taskId, newBoardId, projectId);

    if (res?.error) {
      setTasks(previousTasks);
      toast.error(res.error);
    }
  };

  if (!isMounted) return null;

  return (
  <div className="h-full flex flex-col">
    <div className="shrink-0 mb-4 flex flex-col sm:flex-row gap-3 items-center">
      <div className="relative flex-1 w-full">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Cari nama tugas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all shadow-sm"
        />
      </div>

      <div className="relative w-full sm:w-48">
        <Filter
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-full pl-10 pr-8 py-2.5 appearance-none bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent cursor-pointer shadow-sm text-gray-700 font-medium"
        >
          <option value="all">Semua Prioritas</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>

    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex-1 min-h-0 flex gap-5 overflow-x-auto items-stretch">
        {boards.map((board) => {
          const boardTasks = tasks.filter((t) => t.boardId === board.id);

          const filteredTasks = tasks
            .filter((task) => {
              const matchBoard = task.boardId === board.id;
              const matchSearch = task.title
                .toLowerCase()
                .includes(debouncedSearch.toLowerCase());
              const matchPriority =
                priorityFilter === "all" || task.priority === priorityFilter;
              return matchBoard && matchSearch && matchPriority;
            })
            .sort((a, b) => a.position - b.position);

          return (
            <div
              key={board.id}
              className="flex-1 min-w-70 h-full bg-gray-100/60 rounded-2xl p-3 flex flex-col border border-gray-200/70"
            >
              <div className="shrink-0 flex justify-between items-center mb-3 px-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${statusDotColor(board.name)}`}
                  />
                  <h3 className="font-semibold text-gray-700 text-xs uppercase tracking-wide">
                    {board.name}
                  </h3>
                  <span className="px-2 py-0.5 bg-white text-gray-500 text-[11px] font-semibold rounded-full border border-gray-200">
                    {boardTasks.length}
                  </span>
                </div>
              </div>

              <Droppable droppableId={board.id.toString()}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 min-h-0 overflow-y-auto space-y-2.5 px-0.5 pb-1 transition-colors rounded-xl ${
                      snapshot.isDraggingOver ? "bg-indigo-50" : ""
                    }`}
                  >
                    {filteredTasks.length === 0 && (
                      <div className="h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-300">
                        <Inbox size={20} />
                        <span className="text-xs text-gray-400">
                          {boardTasks.length === 0
                            ? "Belum ada tugas"
                            : "Tidak ditemukan"}
                        </span>
                      </div>
                    )}

                    {filteredTasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => {
                          const isDone = board.name.toLowerCase() === "done";
                          const accentBadge = priorityAccent(task.priority);
                          const hasFooterMeta =
                            task.commentCount > 0 ||
                            (task.assignees && task.assignees.length > 0);

                          return (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() =>
                                setModalState({
                                  isOpen: true,
                                  mode: "edit",
                                  boardId: task.boardId,
                                  task: task,
                                })
                              }
                              className={`bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm transition-all duration-200 cursor-pointer ${
                                snapshot.isDragging
                                  ? "shadow-lg ring-2 ring-indigo-500 rotate-2"
                                  : "hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5"
                              } ${isDone ? "opacity-60 bg-gray-50" : ""}`}
                            >
                              <div
                                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide mb-2 transition-all ${accentBadge} ${
                                  isDone ? "grayscale opacity-60" : ""
                                }`}
                              >
                                {task.priority}
                              </div>

                              <h4
                                className={`font-semibold text-sm leading-snug transition-all duration-300 ${
                                  isDone
                                    ? "line-through text-gray-400"
                                    : "text-gray-900"
                                }`}
                              >
                                {task.title}
                              </h4>

                              {task.description && (
                                <p
                                  className={`text-xs leading-relaxed line-clamp-2 mt-1.5 transition-all ${
                                    isDone
                                      ? "line-through text-gray-400"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {task.description}
                                </p>
                              )}

                              {task.checklists &&
                                task.checklists.length > 0 && (
                                  <div className="mt-3.5">
                                    <div className="flex justify-between items-center mb-1.5 text-[11px] font-semibold text-gray-500">
                                      <span className="flex items-center gap-1.5">
                                        <CheckSquare
                                          size={12}
                                          className="text-gray-400"
                                        />
                                        Progress
                                      </span>
                                      <span>
                                        {
                                          task.checklists.filter(
                                            (c) => c.isCompleted,
                                          ).length
                                        }
                                        /{task.checklists.length}
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          task.checklists.every(
                                            (c) => c.isCompleted,
                                          )
                                            ? "bg-emerald-500"
                                            : "bg-indigo-500"
                                        }`}
                                        style={{
                                          width: `${
                                            (task.checklists.filter(
                                              (c) => c.isCompleted,
                                            ).length /
                                              task.checklists.length) *
                                            100
                                          }%`,
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                )}

                              {hasFooterMeta && (
                                <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between">
                                  {task.commentCount > 0 ? (
                                    <div
                                      className="flex items-center gap-1 text-gray-400 text-xs font-medium"
                                      title={`${task.commentCount} Komentar`}
                                    >
                                      <MessageSquare size={13} />
                                      <span>{task.commentCount}</span>
                                    </div>
                                  ) : (
                                    <span />
                                  )}

                                  {task.assignees &&
                                    task.assignees.length > 0 && (
                                      <div className="flex -space-x-2 overflow-hidden">
                                        {task.assignees.map((assignee, i) => (
                                          <div
                                            key={assignee.userId}
                                            className={`w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-sm transition-all ${
                                              isDone
                                                ? "grayscale opacity-60"
                                                : ""
                                            }`}
                                            style={{ zIndex: 10 - i }}
                                            title={`Ditugaskan ke ${assignee.name}`}
                                          >
                                            {assignee.name
                                              .charAt(0)
                                              .toUpperCase()}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          );
                        }}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {(userRole === "owner" || userRole === "project_manager") &&
                !isReadOnly &&
                board.name.toLowerCase() !== "done" && (
                  <button
                    onClick={() =>
                      setModalState({
                        isOpen: true,
                        mode: "create",
                        boardId: board.id,
                        task: null,
                      })
                    }
                    className="shrink-0 mt-2.5 w-full py-2.5 bg-transparent hover:bg-white text-gray-400 hover:text-indigo-600 text-xs font-semibold rounded-xl border border-dashed border-gray-300 hover:border-indigo-300 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} />
                    Tambah Tugas
                  </button>
                )}
            </div>
          );
        })}
      </div>

      <TaskModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        mode={modalState.mode}
        projectId={projectId}
        boardId={modalState.boardId}
        task={modalState.task}
        userRole={userRole}
        isReadOnly={isReadOnly}
      />
    </DragDropContext>
  </div>
);
}
