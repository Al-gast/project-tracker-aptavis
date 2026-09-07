import prisma from '../lib/prisma.js'
import {
  CircularTaskDependencyError,
  InvalidTaskDependencyError,
  TaskDependencyNotFoundError,
  TaskNotFoundError,
} from '../errors/task.errors.js'

async function canReachTask(
  startTaskId: string,
  targetTaskId: string
): Promise<boolean> {
  const visited = new Set<string>()
  const stack = [startTaskId]

  while (stack.length > 0) {
    const currentTaskId = stack.pop()

    if (!currentTaskId) {
      continue
    }

    if (currentTaskId === targetTaskId) {
      return true
    }

    if (visited.has(currentTaskId)) {
      continue
    }

    visited.add(currentTaskId)

    const dependencies = await prisma.taskDependency.findMany({
      where: {
        taskId: currentTaskId,
      },
      select: {
        dependsOnTaskId: true,
      },
    })

    for (const dependency of dependencies) {
      if (!visited.has(dependency.dependsOnTaskId)) {
        stack.push(dependency.dependsOnTaskId)
      }
    }
  }

  return false
}

export async function addTaskDependency(
  taskId: string,
  dependsOnTaskId: string
) {
  if (taskId === dependsOnTaskId) {
    throw new InvalidTaskDependencyError(
      'Task cannot depend on itself'
    )
  }

  const [task, dependsOnTask] = await Promise.all([
    prisma.task.findUnique({
      where: {
        id: taskId,
      },
    }),

    prisma.task.findUnique({
      where: {
        id: dependsOnTaskId,
      },
    }),
  ])

  if (!task || !dependsOnTask) {
    throw new TaskNotFoundError()
  }

  if (task.projectId !== dependsOnTask.projectId) {
    throw new InvalidTaskDependencyError(
      'Task dependency must belong to the same project'
    )
  }

  const existingDependency =
    await prisma.taskDependency.findUnique({
      where: {
        taskId_dependsOnTaskId: {
          taskId,
          dependsOnTaskId,
        },
      },
    })

  if (existingDependency) {
    throw new InvalidTaskDependencyError(
      'Task dependency already exists'
    )
  }

  const createsCycle = await canReachTask(
    dependsOnTaskId,
    taskId
  )

  if (createsCycle) {
    throw new CircularTaskDependencyError()
  }

  const dependency = await prisma.taskDependency.create({
    data: {
      taskId,
      dependsOnTaskId,
    },
    include: {
      dependsOnTask: true,
    },
  })

  /*
   * Jika task sudah DONE tetapi dependency baru belum DONE,
   * status DONE menjadi tidak valid.
   */
  if (
    task.status === 'DONE' &&
    dependsOnTask.status !== 'DONE'
  ) {
    await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        status: 'IN_PROGRESS',
      },
    })

    await revalidateDependentTasks(taskId)
  }

  return dependency
}

export async function revalidateDependentTasks(
  dependencyTaskId: string
) {
  const dependents = await prisma.taskDependency.findMany({
    where: {
      dependsOnTaskId: dependencyTaskId,
    },
    include: {
      task: {
        include: {
          dependencies: {
            include: {
              dependsOnTask: true,
            },
          },
        },
      },
    },
  })

  for (const relation of dependents) {
    const dependentTask = relation.task

    if (dependentTask.status !== 'DONE') {
      continue
    }

    const hasIncompleteDependency =
      dependentTask.dependencies.some(
        (dependency) =>
          dependency.dependsOnTask.status !== 'DONE'
      )

    if (!hasIncompleteDependency) {
      continue
    }

    await prisma.task.update({
      where: {
        id: dependentTask.id,
      },
      data: {
        status: 'IN_PROGRESS',
      },
    })

    await revalidateDependentTasks(dependentTask.id)
  }
}

export async function removeTaskDependency(
  taskId: string,
  dependsOnTaskId: string
) {
  const dependency =
    await prisma.taskDependency.findUnique({
      where: {
        taskId_dependsOnTaskId: {
          taskId,
          dependsOnTaskId,
        },
      },
    })

  if (!dependency) {
    throw new TaskDependencyNotFoundError()
  }

  await prisma.taskDependency.delete({
    where: {
      taskId_dependsOnTaskId: {
        taskId,
        dependsOnTaskId,
      },
    },
  })

  return dependency
}