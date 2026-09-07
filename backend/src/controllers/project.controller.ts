import type { Request, Response } from 'express'
import { ZodError } from 'zod'

import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  updateProject,
} from '../services/project.service.js'

import {
  createProjectSchema,
  updateProjectSchema,
} from '../validators/project.validator.js'

import {
  ProjectNotFoundError,
  ProjectScheduleConflictError,
} from '../errors/project.errors.js'

type ProjectParams = {
  id: string
}

export async function getProjectsController(
  _req: Request,
  res: Response
) {
  try {
    const projects = await getProjects()

    return res.status(200).json({
      success: true,
      data: projects,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}

export async function getProjectByIdController(
  req: Request<ProjectParams>,
  res: Response
) {
  try {
    const project = await getProjectById(req.params.id)

    return res.status(200).json({
      success: true,
      data: project,
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

export async function createProjectController(
  req: Request,
  res: Response
) {
  try {
    const input = createProjectSchema.parse(req.body)

    const project = await createProject({
      name: input.name,
      startDate: new Date(`${input.startDate}T00:00:00.000Z`),
      endDate: new Date(`${input.endDate}T00:00:00.000Z`),
    })

    return res.status(201).json({
      success: true,
      data: project,
    })
  } catch (error) {
    if (error instanceof ProjectScheduleConflictError) {
    return res.status(409).json({
        success: false,
        message: error.message,
        conflict: {
        id: error.conflict.id,
        name: error.conflict.name,
        startDate: error.conflict.startDate,
        endDate: error.conflict.endDate,
        },
    })
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Internal server error'

    return res.status(400).json({
      success: false,
      message,
    })
  }
}

export async function updateProjectController(
  req: Request<ProjectParams>,
  res: Response
) {
  try {
    const input = updateProjectSchema.parse(req.body)

    const project = await updateProject(req.params.id, {
      name: input.name,
      startDate: new Date(`${input.startDate}T00:00:00.000Z`),
      endDate: new Date(`${input.endDate}T00:00:00.000Z`),
    })

    return res.status(200).json({
      success: true,
      data: project,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      })
    }

    if (error instanceof ProjectNotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    if (error instanceof ProjectScheduleConflictError) {
      return res.status(409).json({
        success: false,
        message: error.message,
        conflict: error.conflict,
      })
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Internal server error'

    return res.status(400).json({
      success: false,
      message,
    })
  }
}

export async function deleteProjectController(
  req: Request<ProjectParams>,
  res: Response
) {
  try {
    const project = await deleteProject(req.params.id)

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      data: project,
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