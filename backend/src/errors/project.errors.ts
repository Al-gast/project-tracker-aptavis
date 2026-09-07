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

export class InvalidProjectDependencyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidProjectDependencyError'
  }
}

export class CircularProjectDependencyError extends Error {
  constructor() {
    super('Circular project dependency is not allowed')
    this.name = 'CircularProjectDependencyError'
  }
}

export class ProjectDependencyNotFoundError extends Error {
  constructor() {
    super('Project dependency not found')
    this.name = 'ProjectDependencyNotFoundError'
  }
}