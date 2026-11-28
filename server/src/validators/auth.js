import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  phone: z.string().trim().min(7).max(20).optional(),
  password: z.string().min(8).max(128),
  role: z.literal('mother').optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export const profileSchema = z.object({
  deliveryDate: z.union([
    z.string().datetime({ allowTrailingTz: true }),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.literal('')
  ]).nullable().optional(),
  deliveryType: z.enum(['normal', 'c-section']).nullable().optional(),
  complications: z.array(z.string()).optional(),
  doctorId: z.string().optional(),
  emergencyContact: z
    .object({
      name: z.string().trim().optional(),
      phone: z.string().trim().optional()
    })
    .optional()
});
