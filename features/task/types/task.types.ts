export type Task = {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  boardId: number;
  position: number;
  assignees?: TaskAssignee[];
  dueDate?: Date | null;
};

export interface TaskAssignee {
  userId: number;
  name: string;
}