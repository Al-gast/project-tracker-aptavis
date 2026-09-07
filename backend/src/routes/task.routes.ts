import { Router } from 'express'

import {
  deleteTaskController,
  getTaskByIdController,
  updateTaskController,
} from '../controllers/task.controller.js'

const router = Router()

router.get('/:id', getTaskByIdController)
router.patch('/:id', updateTaskController)
router.delete('/:id', deleteTaskController)

export default router