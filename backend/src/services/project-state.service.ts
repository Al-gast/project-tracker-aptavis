import prisma from '../lib/prisma.js'
import {
  CircularProjectDependencyError,
  ProjectNotFoundError,
} from '../errors/project.errors.js'

export type ProjectStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'DONE'

export async function calculateProjectStatus(
  projectId: string,
  visiting = new Set<string>()
): Promise<ProjectStatus> {
  if (visiting.has(projectId)) {
    throw new CircularProjectDependencyError()
  }

  const nextVisiting = new Set(visiting)
  nextVisiting.add(projectId)

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      tasks: {
        select: {
          status: true,
        },
      },

      dependencies: {
        select: {
          dependsOnProjectId: true,
        },
      },
    },
  })

  if (!project) {
    throw new ProjectNotFoundError()
  }

  /*
   * Dependency mempunyai prioritas.
   *
   * Project tidak boleh IN_PROGRESS atau DONE
   * jika salah satu project dependency belum DONE.
   */
  for (const dependency of project.dependencies) {
    const dependencyStatus = await calculateProjectStatus(
      dependency.dependsOnProjectId,
      nextVisiting
    )

    if (dependencyStatus !== 'DONE') {
      return 'DRAFT'
    }
  }

  if (project.tasks.length === 0) {
    return 'DRAFT'
  }

  const allDone = project.tasks.every(
    (task) => task.status === 'DONE'
  )

  if (allDone) {
    return 'DONE'
  }

  const allDraft = project.tasks.every(
    (task) => task.status === 'DRAFT'
  )

  if (allDraft) {
    return 'DRAFT'
  }

  return 'IN_PROGRESS'
}

export async function calculateProjectProgress(
  projectId: string
): Promise<number> {
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
    },
    select: {
      status: true,
      weight: true,
    },
  })

  if (tasks.length === 0) {
    return 0
  }

  const totalWeight = tasks.reduce(
    (total, task) => total + task.weight,
    0
  )

  if (totalWeight === 0) {
    return 0
  }

  const completedWeight = tasks
    .filter((task) => task.status === 'DONE')
    .reduce(
      (total, task) => total + task.weight,
      0
    )

  return Number(
    ((completedWeight / totalWeight) * 100).toFixed(2)
  )
}