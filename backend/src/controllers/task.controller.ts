import type { Request, Response } from 'express'
import { ZodError } from 'zod'

import {
  createTask,
  deleteTask,
  getProjectTasks,
  getTaskById,
  updateTask,
} from '../services/task.service.js'

import {
  createTaskSchema,
  updateTaskSchema,
} from '../validators/task.validator.js'

import { ProjectNotFoundError } from '../errors/project.errors.js'

import {
  InvalidParentTaskError,
  ParentTaskNotFoundError,
  TaskHierarchyCycleError,
  TaskNotFoundError,
  IncompleteTaskDependencyError
} from '../errors/task.errors.js'

type ProjectParams = {
  projectId: string
}

type TaskParams = {
  id: string
}

export async function getProjectTasksController(
  req: Request<ProjectParams>,
  res: Response
) {
  try {
    const tasks = await getProjectTasks(
      req.params.projectId
    )

    return res.status(200).json({
      success: true,
      data: tasks,
    })
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    console.error(error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}

export async function getTaskByIdController(
  req: Request<TaskParams>,
  res: Response
) {
  try {
    const task = await getTaskById(req.params.id)

    return res.status(200).json({
      success: true,
      data: task,
    })
  } catch (error) {
    if (error instanceof TaskNotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    console.error(error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}

export async function createTaskController(
  req: Request<ProjectParams>,
  res: Response
) {
  try {
    const input = createTaskSchema.parse(req.body)

    const task = await createTask(
      req.params.projectId,
      input
    )

    return res.status(201).json({
      success: true,
      data: task,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: error.issues,
      })
    }

    if (error instanceof ProjectNotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    if (error instanceof ParentTaskNotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    if (error instanceof InvalidParentTaskError) {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }

    console.error(error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}

export async function updateTaskController(
  req: Request<TaskParams>,
  res: Response
) {
  try {
    const input = updateTaskSchema.parse(req.body)

    const task = await updateTask(
      req.params.id,
      input
    )

    return res.status(200).json({
      success: true,
      data: task,
    })
  } catch (error) {
    if (error instanceof IncompleteTaskDependencyError) {
    return res.status(409).json({
        success: false,
        message: error.message,
        dependencies: error.dependencies,
    })
    }

    if (error instanceof ZodError) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: error.issues,
      })
    }

    if (error instanceof TaskNotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    if (error instanceof ParentTaskNotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    if (
      error instanceof InvalidParentTaskError ||
      error instanceof TaskHierarchyCycleError
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }

    console.error(error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}

export async function deleteTaskController(
  req: Request<TaskParams>,
  res: Response
) {
  try {
    const task = await deleteTask(req.params.id)

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: task,
    })
  } catch (error) {
    if (error instanceof TaskNotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    console.error(error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}