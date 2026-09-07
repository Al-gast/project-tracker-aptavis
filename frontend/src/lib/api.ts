import type {
  CreateProjectInput,
  Project,
  ProjectDetail,
} from '@/types/project'

import type { Task, CreateTaskInput } from '@/types/task'

const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined')
}

type ApiResponse<T> = {
  success: boolean
  data: T
}

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
  projectId: string
): Promise<Task[]> {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/tasks`,
    {
      cache: 'no-store',
    }
  )

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