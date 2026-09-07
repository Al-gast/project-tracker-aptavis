import { Router } from 'express'

import {
  createProjectController,
  deleteProjectController,
  getProjectByIdController,
  getProjectsController,
  updateProjectController,
} from '../controllers/project.controller.js'

import {
  createTaskController,
  getProjectTasksController,
} from '../controllers/task.controller.js'

const router = Router()

router.get('/', getProjectsController)
router.get('/:id', getProjectByIdController)

router.get('/:projectId/tasks', getProjectTasksController)
router.post('/:projectId/tasks', createTaskController)

router.post('/', createProjectController)
router.put('/:id', updateProjectController)
router.delete('/:id', deleteProjectController)

export default router;