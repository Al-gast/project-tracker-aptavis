export class ProjectScheduleConflictError extends Error {
  conflict: {
    id: string
    name: string
    startDate: Date
    endDate: Date
  }

  constructor(conflict: {
    id: string
    name: string
    startDate: Date
    endDate: Date
  }) {
    super('Project schedule conflicts with another project')

    this.name = 'ProjectScheduleConflictError'
    this.conflict = conflict
  }
}

export class ProjectNotFoundError extends Error {
  constructor() {
    super('Project not found')
    this.name = 'ProjectNotFoundError'
  }
}