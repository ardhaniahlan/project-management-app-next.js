export interface TaskAssignee {
  userId: number;
  name: string;
}

// Tambahkan tipe untuk Checklist
export interface TaskChecklist {
  id: number;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  boardId: number;
  position: number;
  dueDate?: Date | null;
  assignees?: TaskAssignee[];
  checklists?: TaskChecklist[]; 
  commentCount: number;
}