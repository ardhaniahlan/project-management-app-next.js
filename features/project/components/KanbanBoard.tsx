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
import { Plus, MoreHorizontal, CheckSquare } from "lucide-react";
import { Task } from "@/features/task/types/task.types";

type Board = { id: number; name: string; position: number };

interface KanbanBoardProps {
  projectId: number;
  boards: Board[];
  initialTasks: Task[];
  userRole: string;
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
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [isMounted, setIsMounted] = useState(false);

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
        const updatedTask = initialTasks.find(t => t.id === prev.task!.id);
        if (updatedTask) return { ...prev, task: updatedTask };
      }
      return prev;
    });
  }, [initialTasks]);

  const onDragEnd = async (result: DropResult) => {
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
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex-1 flex gap-6 overflow-x-auto pb-6 items-start">
        {boards.map((board) => {
          const boardTasks = tasks.filter((t) => t.boardId === board.id);

          return (
            <div
              key={board.id}
              className="flex-1 min-w-70 bg-white rounded-2xl p-4 flex flex-col max-h-full border border-gray-200 shadow-sm"
            >
              <div className="flex justify-between items-center mb-4 px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${statusDotColor(board.name)}`}
                  />
                  <h3 className="font-semibold text-gray-900 text-[13px] tracking-tight">
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
                    className={`flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-37.5 transition-colors rounded-xl ${snapshot.isDraggingOver ? "bg-indigo-50/50" : ""}`}
                  >
                    {boardTasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => {
                          const isDone = board.name.toLowerCase() === "done";
                          const accentBadge = priorityAccent(task.priority);

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
                                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide mb-2 transition-all ${accentBadge} ${isDone ? "grayscale opacity-60" : ""}`}
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

                              {task.checklists && task.checklists.length > 0 && (
                              <div className="mt-3.5 mb-1">
                                <div className="flex justify-between items-center mb-1.5 text-[11px] font-semibold text-gray-500">
                                  <span className="flex items-center gap-1.5">
                                    <CheckSquare size={12} className="text-gray-400" /> 
                                    Progress
                                  </span>
                                  <span>
                                    {task.checklists.filter(c => c.isCompleted).length}/{task.checklists.length}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      task.checklists.every(c => c.isCompleted) ? 'bg-emerald-500' : 'bg-indigo-500'
                                    }`}
                                    style={{ width: `${(task.checklists.filter(c => c.isCompleted).length / task.checklists.length) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}

                              {task.assignees && task.assignees.length > 0 && (
                                <div className="mt-3 flex justify-end">
                                  <div className="flex -space-x-2 overflow-hidden">
                                    {task.assignees.map((assignee, i) => (
                                      <div
                                        key={assignee.userId}
                                        className={` w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-sm transition-all z-[${10 - i}] ${isDone ? "grayscale opacity-60" : ""}`}
                                        title={`Ditugaskan ke ${assignee.name}`}
                                      >
                                        {assignee.name.charAt(0).toUpperCase()}
                                      </div>
                                    ))}
                                  </div>
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
                    className="mt-3 w-full py-2.5 bg-transparent hover:bg-indigo-50/50 text-gray-400 hover:text-indigo-600 text-xs font-semibold rounded-xl border border-dashed border-gray-300 hover:border-indigo-300 transition-colors flex items-center justify-center gap-1.5"
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
      />
    </DragDropContext>
  );
}
