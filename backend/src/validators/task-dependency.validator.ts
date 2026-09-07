import { z } from 'zod'

export const createTaskDependencySchema = z.object({
  dependsOnTaskId: z.string().uuid(),
})