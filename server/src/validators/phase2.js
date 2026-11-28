import { z } from 'zod';

export const recoveryMilestoneSchema = z.object({
  title: z.string().trim().min(1).max(200),
  category: z.enum(['physical', 'emotional', 'wound', 'mobility', 'nutrition']).optional(),
  targetDate: z.string().datetime({ allowTrailingTz: true }).optional().or(z.literal('')),
  status: z.enum(['pending', 'in-progress', 'done']).optional(),
  painLevel: z.number().min(0).max(10).optional(),
  notes: z.string().trim().max(2000).optional()
});

export const babySchema = z.object({
  name: z.string().trim().min(1).max(120),
  dob: z.string().datetime({ allowTrailingTz: true }).optional().or(z.literal('')),
  gender: z.string().trim().max(40).optional(),
  birthWeight: z.number().min(0).optional(),
  notes: z.string().trim().max(2000).optional()
});

export const babyLogSchema = z.object({
  type: z.enum(['feed', 'sleep', 'diaper']),
  feed: z
    .object({
      method: z.string().trim().optional(),
      amountMl: z.number().min(0).optional(),
      durationMin: z.number().min(0).optional(),
      side: z.string().trim().optional()
    })
    .optional(),
  sleep: z
    .object({
      start: z.string().datetime({ allowTrailingTz: true }).optional(),
      end: z.string().datetime({ allowTrailingTz: true }).optional()
    })
    .optional(),
  diaper: z
    .object({
      kind: z.enum(['wet', 'dirty', 'both'])
    })
    .optional(),
  loggedAt: z.string().datetime({ allowTrailingTz: true }).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional()
});
