import { z } from 'zod'

export const createTaskSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Task name is required')
    .max(150, 'Task name must not exceed 150 characters'),

  status: z
    .enum(['DRAFT', 'IN_PROGRESS', 'DONE'])
    .optional()
    .default('DRAFT'),

  weight: z
    .number()
    .int()
    .min(1, 'Weight must be at least 1')
    .optional()
    .default(1),

  parentTaskId: z
    .string()
    .uuid()
    .nullable()
    .optional(),
})

export const updateTaskSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(150)
      .optional(),

    status: z
      .enum(['DRAFT', 'IN_PROGRESS', 'DONE'])
      .optional(),

    weight: z
      .number()
      .int()
      .min(1)
      .optional(),

    parentTaskId: z
      .string()
      .uuid()
      .nullable()
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'At least one field must be provided',
    }
  )