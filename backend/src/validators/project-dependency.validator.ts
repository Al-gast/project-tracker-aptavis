import { z } from 'zod'

export const createProjectDependencySchema = z.object({
  dependsOnProjectId: z.string().uuid(),
})