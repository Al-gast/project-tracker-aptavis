export type ProjectStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'DONE'

export type Project = {
  id: string
  name: string
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
  status: ProjectStatus
  progress: number
}

export type CreateProjectInput = {
  name: string
  startDate: string
  endDate: string
}