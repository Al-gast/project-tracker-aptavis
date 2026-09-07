import type { Request, Response } from 'express'
import { ZodError } from 'zod'

import {
  addProjectDependency,
  removeProjectDependency,
} from '../services/project-dependency.service.js'

import { createProjectDependencySchema } from '../validators/project-dependency.validator.js'

import {
  CircularProjectDependencyError,
  InvalidProjectDependencyError,
  ProjectDependencyNotFoundError,
  ProjectNotFoundError,
} from '../errors/project.errors.js'

type ProjectParams = {
  id: string
}

type ProjectDependencyParams = {
  id: string
  dependencyId: string
}

export async function addProjectDependencyController(
  req: Request<ProjectParams>,
  res: Response
) {
  try {
    const input = createProjectDependencySchema.parse(req.body)

    const dependency = await addProjectDependency(
      req.params.id,
      input.dependsOnProjectId
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

    if (error instanceof ProjectNotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    if (
      error instanceof InvalidProjectDependencyError ||
      error instanceof CircularProjectDependencyError
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

export async function removeProjectDependencyController(
  req: Request<ProjectDependencyParams>,
  res: Response
) {
  try {
    await removeProjectDependency(
      req.params.id,
      req.params.dependencyId
    )

    return res.status(200).json({
      success: true,
      message: 'Project dependency removed successfully',
    })
  } catch (error) {
    if (error instanceof ProjectDependencyNotFoundError) {
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