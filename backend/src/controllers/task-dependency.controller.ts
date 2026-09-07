import type { Request, Response } from 'express'
import { ZodError } from 'zod'

import {
  addTaskDependency,
  removeTaskDependency,
} from '../services/task-dependency.service.js'

import { createTaskDependencySchema } from '../validators/task-dependency.validator.js'

import {
  CircularTaskDependencyError,
  InvalidTaskDependencyError,
  TaskDependencyNotFoundError,
  TaskNotFoundError,
} from '../errors/task.errors.js'

type TaskParams = {
  id: string
}

type TaskDependencyParams = {
  id: string
  dependencyId: string
}

export async function addTaskDependencyController(
  req: Request<TaskParams>,
  res: Response
) {
  try {
    const input = createTaskDependencySchema.parse(req.body)

    const dependency = await addTaskDependency(
      req.params.id,
      input.dependsOnTaskId
    )

    return res.status(201).json({
      success: true,
      data: dependency,
    })
  } catch (error) {
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

    if (
      error instanceof InvalidTaskDependencyError ||
      error instanceof CircularTaskDependencyError
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

export async function removeTaskDependencyController(
  req: Request<TaskDependencyParams>,
  res: Response
) {
  try {
    await removeTaskDependency(
      req.params.id,
      req.params.dependencyId
    )

    return res.status(200).json({
      success: true,
      message: 'Task dependency removed successfully',
    })
  } catch (error) {
    if (error instanceof TaskDependencyNotFoundError) {
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