import prisma from '../lib/prisma.js'
import { ProjectNotFoundError } from '../errors/project.errors.js'
import {
  InvalidParentTaskError,
  ParentTaskNotFoundError,
  TaskHierarchyCycleError,
  TaskNotFoundError,
} from '../errors/task.errors.js'

type TaskStatus = 'DRAFT' | 'IN_PROGRESS' | 'DONE'

type CreateTaskInput = {
  name: string
  status: TaskStatus
  weight: number
  parentTaskId?: string | null
}

type UpdateTaskInput = {
  name?: string
  status?: TaskStatus
  weight?: number
  parentTaskId?: string | null
}

type TaskRow = {
  id: string
  projectId: string
  parentTaskId: string | null
  name: string
  status: TaskStatus
  weight: number
  createdAt: Date
  updatedAt: Date
}

type TaskTreeNode = TaskRow & {
  subtasks: TaskTreeNode[]
}

function buildTaskTree(tasks: TaskRow[]): TaskTreeNode[] {
  const taskMap = new Map<string, TaskTreeNode>()

  for (const task of tasks) {
    taskMap.set(task.id, {
      ...task,
      subtasks: [],
    })
  }

  const roots: TaskTreeNode[] = []

  for (const task of tasks) {
    const node = taskMap.get(task.id)!

    if (!task.parentTaskId) {
      roots.push(node)
      continue
    }

    const parent = taskMap.get(task.parentTaskId)

    if (parent) {
      parent.subtasks.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

async function ensureNoHierarchyCycle(
  taskId: string,
  parentTaskId: string
) {
  let currentTaskId: string | null = parentTaskId

  while (currentTaskId) {
    if (currentTaskId === taskId) {
      throw new TaskHierarchyCycleError()
    }

    const currentTask: { parentTaskId: string | null } | null =
      await prisma.task.findUnique({
        where: {
          id: currentTaskId,
        },
        select: {
          parentTaskId: true,
        },
      })

    currentTaskId = currentTask?.parentTaskId ?? null
  }
}

export async function getProjectTasks(projectId: string) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  })

  if (!project) {
    throw new ProjectNotFoundError()
  }

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return buildTaskTree(tasks)
}

export async function getTaskById(taskId: string) {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
    include: {
      parent: true,
      subtasks: true,
      dependencies: {
        include: {
          dependsOnTask: true,
        },
      },
    },
  })

  if (!task) {
    throw new TaskNotFoundError()
  }

  return task
}

export async function createTask(
  projectId: string,
  input: CreateTaskInput
) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  })

  if (!project) {
    throw new ProjectNotFoundError()
  }

  if (input.parentTaskId) {
    const parentTask = await prisma.task.findUnique({
      where: {
        id: input.parentTaskId,
      },
    })

    if (!parentTask) {
      throw new ParentTaskNotFoundError()
    }

    if (parentTask.projectId !== projectId) {
      throw new InvalidParentTaskError(
        'Parent task must belong to the same project'
      )
    }
  }

  return prisma.task.create({
    data: {
      projectId,
      name: input.name,
      status: input.status,
      weight: input.weight,
      parentTaskId: input.parentTaskId ?? null,
    },
  })
}

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput
) {
  const existingTask = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  })

  if (!existingTask) {
    throw new TaskNotFoundError()
  }

  if (input.parentTaskId !== undefined) {
    if (input.parentTaskId === taskId) {
      throw new InvalidParentTaskError(
        'Task cannot be its own parent'
      )
    }

    if (input.parentTaskId !== null) {
      const parentTask = await prisma.task.findUnique({
        where: {
          id: input.parentTaskId,
        },
      })

      if (!parentTask) {
        throw new ParentTaskNotFoundError()
      }

      if (parentTask.projectId !== existingTask.projectId) {
        throw new InvalidParentTaskError(
          'Parent task must belong to the same project'
        )
      }

      await ensureNoHierarchyCycle(
        taskId,
        input.parentTaskId
      )
    }
  }

  return prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      name: input.name,
      status: input.status,
      weight: input.weight,
      parentTaskId: input.parentTaskId,
    },
  })
}

export async function deleteTask(taskId: string) {
  const existingTask = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  })

  if (!existingTask) {
    throw new TaskNotFoundError()
  }

  await prisma.task.delete({
    where: {
      id: taskId,
    },
  })

  return existingTask
}