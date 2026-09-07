export class TaskNotFoundError extends Error {
  constructor() {
    super('Task not found')
    this.name = 'TaskNotFoundError'
  }
}

export class ParentTaskNotFoundError extends Error {
  constructor() {
    super('Parent task not found')
    this.name = 'ParentTaskNotFoundError'
  }
}

export class InvalidParentTaskError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidParentTaskError'
  }
}

export class TaskHierarchyCycleError extends Error {
  constructor() {
    super('Task hierarchy cannot contain a circular parent relationship')
    this.name = 'TaskHierarchyCycleError'
  }
}

export class InvalidTaskDependencyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidTaskDependencyError'
  }
}

export class CircularTaskDependencyError extends Error {
  constructor() {
    super('Circular task dependency is not allowed')
    this.name = 'CircularTaskDependencyError'
  }
}

export class TaskDependencyNotFoundError extends Error {
  constructor() {
    super('Task dependency not found')
    this.name = 'TaskDependencyNotFoundError'
  }
}

export class IncompleteTaskDependencyError extends Error {
  dependencies: {
    id: string
    name: string
    status: string
  }[]

  constructor(
    dependencies: {
      id: string
      name: string
      status: string
    }[]
  ) {
    super('Task cannot be marked as Done because dependencies are incomplete')
    this.name = 'IncompleteTaskDependencyError'
    this.dependencies = dependencies
  }
}