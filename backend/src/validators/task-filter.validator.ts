import { z } from 'zod'

export const taskFilterSchema = z.object({
  search: z
    .string()
    .trim()
    .optional(),

  status: z
    .enum(['DRAFT', 'IN_PROGRESS', 'DONE'])
    .optional(),
})

export type TaskFilterInput = z.infer<typeof taskFilterSchema>