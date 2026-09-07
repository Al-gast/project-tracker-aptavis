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