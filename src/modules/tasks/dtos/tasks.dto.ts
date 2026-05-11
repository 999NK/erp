export interface CreateTaskDTO {
  companyId: string;
  createdByUserId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedToUserId?: string;
  sectorId?: string;
  dueDate?: Date;
  checklistItems?: string[];
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedToUserId?: string | null;
  sectorId?: string | null;
  dueDate?: Date | null;
}

export interface AddActivityDTO {
  taskId: string;
  userId: string;
  type: string;
  content: string;
  metadata?: any;
}
