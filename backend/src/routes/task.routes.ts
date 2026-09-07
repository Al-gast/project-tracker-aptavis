import { Router } from 'express'

import {
  deleteTaskController,
  getTaskByIdController,
  updateTaskController,
} from '../controllers/task.controller.js'

import {
  addTaskDependencyController,
  removeTaskDependencyController,
} from '../controllers/task-dependency.controller.js'

const router = Router()

router.get('/:id', getTaskByIdController)
router.patch('/:id', updateTaskController)
router.delete('/:id', deleteTaskController)
router.post(
  '/:id/dependencies',
  addTaskDependencyController
)
router.delete(
  '/:id/dependencies/:dependencyId',
  removeTaskDependencyController
)

export default router