import prisma from '../lib/prisma.js'
import {
  ProjectNotFoundError,
  ProjectScheduleConflictError,
} from '../errors/project.errors.js'
import {
  calculateProjectProgress,
  calculateProjectStatus,
} from './project-state.service.js'

type CreateProjectInput = {
  name: string
  startDate: Date
  endDate: Date
}

type UpdateProjectInput = {
  name?: string
  startDate?: Date
  endDate?: Date
}

export async function getProjects() {
  const projects = await prisma.project.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })

  return Promise.all(
    projects.map(async (project) => ({
      ...project,
      status: await calculateProjectStatus(project.id),
      progress: await calculateProjectProgress(project.id),
    }))
  )
}

export async function getProjectById(projectId: string) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      dependencies: {
        include: {
          dependsOnProject: true,
        },
      },

      dependents: {
        include: {
          project: true,
        },
      },
    },
  })

  if (!project) {
    throw new ProjectNotFoundError()
  }

  const [status, progress] = await Promise.all([
    calculateProjectStatus(projectId),
    calculateProjectProgress(projectId),
  ])

  return {
    ...project,
    status,
    progress,
  }
}

export async function createProject(input: CreateProjectInput) {
  const { name, startDate, endDate } = input

  if (startDate > endDate) {
    throw new Error('Start date cannot be after end date')
  }

  const conflictingProject = await prisma.project.findFirst({
    where: {
      startDate: {
        lte: endDate,
      },
      endDate: {
        gte: startDate,
      },
    },
  })

  if (conflictingProject) {
    throw new ProjectScheduleConflictError({
      id: conflictingProject.id,
      name: conflictingProject.name,
      startDate: conflictingProject.startDate,
      endDate: conflictingProject.endDate,
    })
  }

  return prisma.project.create({
    data: {
      name,
      startDate,
      endDate,
    },
  })
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput
) {
  const existingProject = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!existingProject) {
    throw new ProjectNotFoundError()
  }

  const name = input.name ?? existingProject.name
  const startDate = input.startDate ?? existingProject.startDate
  const endDate = input.endDate ?? existingProject.endDate

  if (startDate > endDate) {
    throw new Error('Start date cannot be after end date')
  }

  const conflictingProject = await prisma.project.findFirst({
    where: {
      id: {
        not: projectId,
      },
      startDate: {
        lte: endDate,
      },
      endDate: {
        gte: startDate,
      },
    },
  })

  if (conflictingProject) {
    throw new ProjectScheduleConflictError({
      id: conflictingProject.id,
      name: conflictingProject.name,
      startDate: conflictingProject.startDate,
      endDate: conflictingProject.endDate,
    })
  }

  return prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      name,
      startDate,
      endDate,
    },
  })
}

export async function deleteProject(projectId: string) {
  const existingProject = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  })

  if (!existingProject) {
    throw new ProjectNotFoundError()
  }

  await prisma.project.delete({
    where: {
      id: projectId,
    },
  })

  return existingProject
}