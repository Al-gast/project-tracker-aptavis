import prisma from '../lib/prisma.js'
import {
  CircularProjectDependencyError,
  InvalidProjectDependencyError,
  ProjectDependencyNotFoundError,
  ProjectNotFoundError,
} from '../errors/project.errors.js'

async function canReachProject(
  startProjectId: string,
  targetProjectId: string
): Promise<boolean> {
  const visited = new Set<string>()
  const stack = [startProjectId]

  while (stack.length > 0) {
    const currentProjectId = stack.pop()

    if (!currentProjectId) {
      continue
    }

    if (currentProjectId === targetProjectId) {
      return true
    }

    if (visited.has(currentProjectId)) {
      continue
    }

    visited.add(currentProjectId)

    const dependencies =
      await prisma.projectDependency.findMany({
        where: {
          projectId: currentProjectId,
        },
        select: {
          dependsOnProjectId: true,
        },
      })

    for (const dependency of dependencies) {
      if (!visited.has(dependency.dependsOnProjectId)) {
        stack.push(dependency.dependsOnProjectId)
      }
    }
  }

  return false
}

export async function addProjectDependency(
  projectId: string,
  dependsOnProjectId: string
) {
  if (projectId === dependsOnProjectId) {
    throw new InvalidProjectDependencyError(
      'Project cannot depend on itself'
    )
  }

  const [project, dependsOnProject] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
    }),

    prisma.project.findUnique({
      where: { id: dependsOnProjectId },
    }),
  ])

  if (!project || !dependsOnProject) {
    throw new ProjectNotFoundError()
  }

  const existingDependency =
    await prisma.projectDependency.findUnique({
      where: {
        projectId_dependsOnProjectId: {
          projectId,
          dependsOnProjectId,
        },
      },
    })

  if (existingDependency) {
    throw new InvalidProjectDependencyError(
      'Project dependency already exists'
    )
  }

  const createsCycle = await canReachProject(
    dependsOnProjectId,
    projectId
  )

  if (createsCycle) {
    throw new CircularProjectDependencyError()
  }

  return prisma.projectDependency.create({
    data: {
      projectId,
      dependsOnProjectId,
    },
    include: {
      dependsOnProject: true,
    },
  })
}

export async function removeProjectDependency(
  projectId: string,
  dependsOnProjectId: string
) {
  const dependency =
    await prisma.projectDependency.findUnique({
      where: {
        projectId_dependsOnProjectId: {
          projectId,
          dependsOnProjectId,
        },
      },
    })

  if (!dependency) {
    throw new ProjectDependencyNotFoundError()
  }

  await prisma.projectDependency.delete({
    where: {
      projectId_dependsOnProjectId: {
        projectId,
        dependsOnProjectId,
      },
    },
  })

  return dependency
}