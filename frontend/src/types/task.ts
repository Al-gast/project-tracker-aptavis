export type TaskStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'DONE'

export type Task = {
  id: string
  projectId: string
  parentTaskId: string | null
  name: string
  status: TaskStatus
  weight: number
  createdAt: string
  updatedAt: string
  subtasks: Task[]
}

export type CreateTaskInput = {
  name: string
  weight: number
  status?: TaskStatus
  parentTaskId?: string | null
}