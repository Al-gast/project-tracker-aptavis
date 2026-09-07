import { Router } from 'express'

import {
  createProjectController,
  deleteProjectController,
  getProjectByIdController,
  getProjectsController,
  updateProjectController,
} from '../controllers/project.controller.js'

const router = Router()

router.get('/', getProjectsController)
router.get('/:id', getProjectByIdController)

router.post('/', createProjectController)
router.put('/:id', updateProjectController)
router.delete('/:id', deleteProjectController)

export default router;