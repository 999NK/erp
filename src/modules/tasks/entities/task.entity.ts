export interface TaskEntity {
  id: string;
  companyId: string;
  title: string;
  description: string | null;
  status: string; // PENDING, IN_PROGRESS, WAITING, COMPLETED, CANCELLED, OVERDUE
  priority: string; // LOW, MEDIUM, HIGH, URGENT
  createdByUserId: string;
  assignedToUserId: string | null;
  sectorId: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  
  // Relations mapped loosely
  createdByUser?: { name: string, email: string };
  assignedToUser?: { name: string, email: string };
  activities?: TaskActivityEntity[];
}

export interface TaskActivityEntity {
  id: string;
  taskId: string;
  userId: string;
  type: string;
  content: string;
  metadata: string | null;
  createdAt: Date;
  
  user?: { name: string };
}
