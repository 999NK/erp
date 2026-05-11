import { TaskEntity, TaskActivityEntity } from '../entities/task.entity';
import { CreateTaskDTO, UpdateTaskDTO, AddActivityDTO } from '../dtos/tasks.dto';

export interface ITasksRepository {
  create(data: CreateTaskDTO): Promise<TaskEntity>;
  findById(id: string, companyId: string): Promise<TaskEntity | null>;
  findAll(companyId: string, filters?: any): Promise<TaskEntity[]>;
  update(id: string, companyId: string, data: UpdateTaskDTO): Promise<TaskEntity>;
  delete(id: string, companyId: string): Promise<void>;
  
  addActivity(data: AddActivityDTO): Promise<TaskActivityEntity>;
  getActivities(taskId: string): Promise<TaskActivityEntity[]>;
  
  addChecklistItem(taskId: string, text: string): Promise<any>;
  toggleChecklistItem(itemId: string, completed: boolean, userId: string | null): Promise<any>;
  addAttachment(taskId: string, userId: string, data: { fileName: string; fileUrl: string; fileSize: number; mimeType: string }): Promise<any>;
}
