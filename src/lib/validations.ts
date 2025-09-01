import { z } from 'zod'

export const createNoteSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  raw_transcript: z.string().optional().nullable(),
  processed_content: z.string()
    .min(1, 'Content is required'),
  summary: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
})

export const updateNoteSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .optional(),
  raw_transcript: z.string().optional().nullable(),
  processed_content: z.string()
    .min(1, 'Content is required')
    .optional(),
  summary: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
})

export const noteIdSchema = z.object({
  id: z.string().uuid('Invalid note ID format'),
})

export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
export type NoteIdParams = z.infer<typeof noteIdSchema>