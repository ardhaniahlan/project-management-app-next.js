'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { moveTask } from '@/features/task/actions/taskActions';
import { CreateTaskModal } from '@/features/task/components/CreateTaskModal';
import { toast } from 'sonner';

type Board = { id: number; name: string; position: number };
type Task = { id: number; title: string; description: string | null; priority: string; boardId: number; position: number };

interface KanbanBoardProps {
  projectId: number;
  boards: Board[];
  initialTasks: Task[];
}

export function KanbanBoard({ projectId, boards, initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setTasks(initialTasks); 
  }, [initialTasks]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = parseInt(draggableId);
    const newBoardId = parseInt(destination.droppableId);

    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, boardId: newBoardId } : t));

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
            <div key={board.id} className="w-80 shrink-0 bg-gray-100/80 rounded-2xl p-4 flex flex-col max-h-full border border-gray-200/60 shadow-sm">
              
              <div className="flex justify-between items-center mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800 text-sm">{board.name}</h3>
                  <span className="w-5 h-5 bg-gray-200 text-gray-700 text-xs font-bold rounded-full flex items-center justify-center">
                    {boardTasks.length}
                  </span>
                </div>
              </div>

              <Droppable droppableId={board.id.toString()}>
                {(provided, snapshot) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef}
                    className={`flex-1 overflow-y-auto space-y-3 pr-1 min-h-37.5 transition-colors rounded-xl ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''}`}
                  >
                    {boardTasks.map((task, index) => (
                      
                      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                        {(provided, snapshot) => {
                          const isDone = board.name.toLowerCase() === 'done';

                          return (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-all ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500 rotate-2' : 'hover:shadow-md'
                              } ${isDone ? 'opacity-70 bg-gray-50' : ''}`}
                            >
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <h4 className={`font-medium text-sm transition-all duration-300 ${
                                  isDone ? 'line-through text-gray-400' : 'text-gray-900'
                                }`}>
                                  {task.title}
                                </h4>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase transition-all ${
                                  task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                  task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                  'bg-green-100 text-green-700'
                                } ${isDone ? 'grayscale opacity-60' : ''}`}>
                                  {task.priority}
                                </span>
                              </div>
                              {task.description && (
                                <p className={`text-xs line-clamp-2 transition-all ${
                                  isDone ? 'line-through text-gray-400' : 'text-gray-500'
                                }`}>
                                  {task.description}
                                </p>
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

              <CreateTaskModal projectId={projectId} boardId={board.id} />
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}