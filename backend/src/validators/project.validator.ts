import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Project name is required')
    .max(150, 'Project name must not exceed 150 characters'),

  startDate: z
    .string()
    .date('startDate must use YYYY-MM-DD format'),

  endDate: z
    .string()
    .date('endDate must use YYYY-MM-DD format'),
})

export const updateProjectSchema = createProjectSchema.partial()

export type CreateProjectInput = z.infer<typeof createProjectSchema>