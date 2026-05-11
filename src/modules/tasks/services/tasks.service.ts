import { ITasksRepository } from '../repositories/tasks.repository';
import { CreateTaskDTO, UpdateTaskDTO } from '../dtos/tasks.dto';

export class TasksService {
  constructor(private readonly tasksRepository: ITasksRepository) {}

  async createTask(data: CreateTaskDTO) {
    const task = await this.tasksRepository.create(data);
    
    await this.tasksRepository.addActivity({
      taskId: task.id,
      userId: data.createdByUserId,
      type: 'CREATION',
      content: 'Demanda criada',
    });

    return task;
  }

  async listTasks(companyId: string, filters: any, userRole: string, userId: string) {
    // If not ADMIN or MANAGER, can only see assigned tasks
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      filters.assignedToUserId = userId;
    }
    return this.tasksRepository.findAll(companyId, filters);
  }

  async getTask(id: string, companyId: string, userRole: string, userId: string) {
    const task = await this.tasksRepository.findById(id, companyId);
    if (!task) throw new Error('Task not found');

    if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && task.assignedToUserId !== userId) {
      throw new Error('Access denied');
    }

    return task;
  }

  async updateTaskStatus(id: string, companyId: string, status: string, userId: string) {
    const task = await this.tasksRepository.findById(id, companyId);
    if (!task) throw new Error('Task not found');

    const oldStatus = task.status;
    
    // Complete logic if status is COMPLETED
    const updateData: UpdateTaskDTO = { status };
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }

    const updatedTask = await this.tasksRepository.update(id, companyId, updateData);

    await this.tasksRepository.addActivity({
      taskId: task.id,
      userId,
      type: 'STATUS_CHANGE',
      content: `Status alterado de ${oldStatus} para ${status}`,
      metadata: { oldStatus, newStatus: status }
    });

    return updatedTask;
  }

  async addComment(taskId: string, companyId: string, userId: string, content: string) {
    const task = await this.tasksRepository.findById(taskId, companyId);
    if (!task) throw new Error('Task not found');

    return this.tasksRepository.addActivity({
      taskId,
      userId,
      type: 'COMMENT',
      content
    });
  }

  async addChecklistItem(taskId: string, companyId: string, text: string) {
    const task = await this.tasksRepository.findById(taskId, companyId);
    if (!task) throw new Error('Task not found');

    return this.tasksRepository.addChecklistItem(taskId, text);
  }

  async toggleChecklistItem(taskId: string, itemId: string, companyId: string, userId: string, completed: boolean) {
    const task = await this.tasksRepository.findById(taskId, companyId);
    if (!task) throw new Error('Task not found');

    return this.tasksRepository.toggleChecklistItem(itemId, completed, completed ? userId : null);
  }

  async addAttachment(taskId: string, companyId: string, userId: string, data: { fileName: string; fileUrl: string; fileSize: number; mimeType: string }) {
    const task = await this.tasksRepository.findById(taskId, companyId);
    if (!task) throw new Error('Task not found');

    const attachment = await this.tasksRepository.addAttachment(taskId, userId, data);

    await this.tasksRepository.addActivity({
      taskId,
      userId,
      type: 'COMMENT',
      content: `📎 Novo anexo adicionado: ${data.fileName}`
    });

    return attachment;
  }
}
