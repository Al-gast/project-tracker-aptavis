import type {
  CreateProjectInput,
  Project,
  ProjectDetail,
} from '@/types/project'

import type { Task, CreateTaskInput, UpdateTaskInput, TaskDetail, TaskFilter } from '@/types/task'

const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined')
}

type ApiResponse<T> = {
  success: boolean
  data: T
}

// Project APIs
export async function getProjects(): Promise<Project[]> {
  const response = await fetch(`${API_URL}/projects`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch projects')
  }

  const result: ApiResponse<Project[]> =
    await response.json()

  return result.data
}

export async function getProjectTasks(
  projectId: string,
  filter: TaskFilter = {}
): Promise<Task[]> {
  const params = new URLSearchParams()

  if (filter.search?.trim()) {
    params.set('search', filter.search.trim())
  }

  if (filter.status) {
    params.set('status', filter.status)
  }

  const query = params.toString()

  const url = query
    ? `${API_URL}/projects/${projectId}/tasks?${query}`
    : `${API_URL}/projects/${projectId}/tasks`

  const response = await fetch(url, {
    cache: 'no-store',
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ?? 'Failed to fetch tasks'
    )
  }

  return result.data
}

export async function getProject(
  projectId: string
): Promise<ProjectDetail> {
  const response = await fetch(
    `${API_URL}/projects/${projectId}`,
    {
      cache: 'no-store',
    }
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ?? 'Failed to fetch project'
    )
  }

  return result.data
}

export async function createProject(
  input: CreateProjectInput
) {
  const response = await fetch(`${API_URL}/projects`, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify(input),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ?? 'Failed to create project'
    )
  }

  return result.data
}

export async function addProjectDependency(
  projectId: string,
  dependsOnProjectId: string
) {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/dependencies`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dependsOnProjectId,
      }),
    }
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ??
        'Failed to add project dependency'
    )
  }

  return result.data
}

export async function removeProjectDependency(
  projectId: string,
  dependsOnProjectId: string
) {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/dependencies/${dependsOnProjectId}`,
    {
      method: 'DELETE',
    }
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ??
        'Failed to remove project dependency'
    )
  }

  return result.data
}

// Task APIs
export async function getTask(
  taskId: string
): Promise<TaskDetail> {
  const response = await fetch(
    `${API_URL}/tasks/${taskId}`,
    {
      cache: 'no-store',
    }
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ?? 'Failed to fetch task'
    )
  }

  return result.data
}

export async function addTaskDependency(
  taskId: string,
  dependsOnTaskId: string
) {
  const response = await fetch(
    `${API_URL}/tasks/${taskId}/dependencies`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dependsOnTaskId,
      }),
    }
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ??
        'Failed to add task dependency'
    )
  }

  return result.data
}

export async function createTask(
  projectId: string,
  input: CreateTaskInput
): Promise<Task> {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/tasks`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ?? 'Failed to create task'
    )
  }

  return result.data
}

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput
): Promise<Task> {
  const response = await fetch(
    `${API_URL}/tasks/${taskId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }
  )

  const result = await response.json()

  if (!response.ok) {
    if (result.dependencies) {
      const dependencies = result.dependencies
        .map(
          (dependency: {
            name: string
            status: string
          }) =>
            `${dependency.name} (${dependency.status})`
        )
        .join(', ')

      throw new Error(
        `${result.message}: ${dependencies}`
      )
    }

    throw new Error(
      result.message ?? 'Failed to update task'
    )
  }

  return result.data
}

export async function removeTaskDependency(
  taskId: string,
  dependsOnTaskId: string
) {
  const response = await fetch(
    `${API_URL}/tasks/${taskId}/dependencies/${dependsOnTaskId}`,
    {
      method: 'DELETE',
    }
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ??
        'Failed to remove task dependency'
    )
  }

  return result.data
}