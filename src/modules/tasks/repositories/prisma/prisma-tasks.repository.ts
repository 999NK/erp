import { PrismaClient } from '@prisma/client';
import { ITasksRepository } from '../tasks.repository';
import { TaskEntity, TaskActivityEntity } from '../../entities/task.entity';
import { CreateTaskDTO, UpdateTaskDTO, AddActivityDTO } from '../../dtos/tasks.dto';

const prisma = new PrismaClient();

export class PrismaTasksRepository implements ITasksRepository {
  async create(data: CreateTaskDTO): Promise<TaskEntity> {
    const task = await prisma.task.create({
      data: {
        companyId: data.companyId,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        createdByUserId: data.createdByUserId,
        assignedToUserId: data.assignedToUserId,
        sectorId: data.sectorId,
        dueDate: data.dueDate,
        checklist: data.checklistItems?.length ? {
          create: data.checklistItems.map((text: string) => ({ text }))
        } : undefined
      },
      include: {
        createdByUser: { select: { name: true, email: true } },
        assignedToUser: { select: { name: true, email: true } },
      }
    });
    return task as unknown as TaskEntity;
  }

  async findById(id: string, companyId: string): Promise<TaskEntity | null> {
    const task = await prisma.task.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        createdByUser: { select: { name: true, email: true } },
        assignedToUser: { select: { name: true, email: true } },
        checklist: { orderBy: { createdAt: 'asc' } },
        attachments: { orderBy: { createdAt: 'asc' } },
        activities: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    return task as unknown as TaskEntity | null;
  }

  async findAll(companyId: string, filters?: any): Promise<TaskEntity[]> {
    const where: any = { companyId, deletedAt: null };
    
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.assignedToUserId) where.assignedToUserId = filters.assignedToUserId;
    if (filters?.createdByUserId) where.createdByUserId = filters.createdByUserId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        createdByUser: { select: { name: true, email: true } },
        assignedToUser: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    return tasks as unknown as TaskEntity[];
  }

  async update(id: string, companyId: string, data: UpdateTaskDTO): Promise<TaskEntity> {
    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        createdByUser: { select: { name: true, email: true } },
        assignedToUser: { select: { name: true, email: true } },
      }
    });
    return task as unknown as TaskEntity;
  }

  async delete(id: string, companyId: string): Promise<void> {
    await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async addActivity(data: AddActivityDTO): Promise<TaskActivityEntity> {
    const activity = await prisma.taskActivity.create({
      data: {
        taskId: data.taskId,
        userId: data.userId,
        type: data.type,
        content: data.content,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
      include: {
        user: { select: { name: true } }
      }
    });
    return activity as unknown as TaskActivityEntity;
  }

  async getActivities(taskId: string): Promise<TaskActivityEntity[]> {
    const activities = await prisma.taskActivity.findMany({
      where: { taskId },
      include: {
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return activities as unknown as TaskActivityEntity[];
  }

  async addChecklistItem(taskId: string, text: string): Promise<any> {
    return prisma.taskChecklistItem.create({
      data: { taskId, text }
    });
  }

  async toggleChecklistItem(itemId: string, completed: boolean, userId: string | null): Promise<any> {
    return prisma.taskChecklistItem.update({
      where: { id: itemId },
      data: { 
        completed, 
        completedAt: completed ? new Date() : null,
        completedByUserId: userId 
      }
    });
  }

  async addAttachment(taskId: string, userId: string, data: { fileName: string; fileUrl: string; fileSize: number; mimeType: string }): Promise<any> {
    return prisma.taskAttachment.create({
      data: {
        taskId,
        userId,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType
      }
    });
  }
}
