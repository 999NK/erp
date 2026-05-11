import { Request, Response } from 'express';
import { TasksService } from '../../services/tasks.service';

export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  async create(req: Request, res: Response) {
    try {
      const task = await this.tasksService.createTask({
        ...req.body,
        companyId: req.user.companyId,
        createdByUserId: req.user.id
      });
      return res.status(201).json({ success: true, data: task });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const filters = req.query;
      const tasks = await this.tasksService.listTasks(
        req.user.companyId,
        filters,
        req.user.role,
        req.user.id
      );
      return res.json({ success: true, data: tasks });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const task = await this.tasksService.getTask(
        req.params.id,
        req.user.companyId,
        req.user.role,
        req.user.id
      );
      return res.json({ success: true, data: task });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      const task = await this.tasksService.updateTaskStatus(
        req.params.id,
        req.user.companyId,
        status,
        req.user.id
      );
      return res.json({ success: true, data: task });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async addComment(req: Request, res: Response) {
    try {
      const { content } = req.body;
      const activity = await this.tasksService.addComment(
        req.params.id,
        req.user.companyId,
        req.user.id,
        content
      );
      return res.status(201).json({ success: true, data: activity });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async addChecklist(req: Request, res: Response) {
    try {
      const { text } = req.body;
      const item = await this.tasksService.addChecklistItem(
        req.params.id,
        req.user.companyId,
        text
      );
      return res.status(201).json({ success: true, data: item });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async toggleChecklist(req: Request, res: Response) {
    try {
      const { completed } = req.body;
      const item = await this.tasksService.toggleChecklistItem(
        req.params.id,
        req.params.itemId,
        req.user.companyId,
        req.user.id,
        completed
      );
      return res.json({ success: true, data: item });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async addAttachment(req: Request, res: Response) {
    try {
      const attachment = await this.tasksService.addAttachment(
        req.params.id,
        req.user.companyId,
        req.user.id,
        req.body
      );
      return res.status(201).json({ success: true, data: attachment });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}
