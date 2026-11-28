import { z } from 'zod';

const permissionsSchema = z.object({
  viewBabyLogs: z.boolean(),
  viewRecovery: z.boolean(),
  viewMood: z.boolean(),
  logBabyData: z.boolean()
});

export const screeningSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      score: z.number().int().min(0).max(3)
    })
  ).min(1)
});

export const reminderSchema = z.object({
  type: z.enum(['medication', 'appointment', 'custom']),
  title: z.string().trim().min(1).max(160),
  dosage: z.string().max(120).optional(),
  scheduleType: z.enum(['once', 'daily', 'weekly']),
  times: z.array(z.string().regex(/^\d{2}:\d{2}$/)).default([]),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  scheduledAt: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  timezone: z.string().max(100).default('UTC'),
  location: z.string().max(300).optional()
}).superRefine((reminder, context) => {
  if (reminder.scheduleType === 'once' && !reminder.scheduledAt) {
    context.addIssue({ code: 'custom', message: 'A scheduled date is required for one-time reminders' });
  }
  if (reminder.scheduleType !== 'once' && reminder.times.length === 0) {
    context.addIssue({ code: 'custom', message: 'At least one reminder time is required' });
  }
  if (reminder.scheduleType === 'weekly' && reminder.daysOfWeek.length === 0) {
    context.addIssue({ code: 'custom', message: 'Select at least one weekday' });
  }
});

export const reminderUpdateSchema = z.object({
  status: z.enum(['active', 'paused', 'completed']).optional()
}).refine((value) => Object.keys(value).length > 0);

export const familyInviteSchema = z.object({
  email: z.string().email().max(254),
  permissions: permissionsSchema
});

export const familyPermissionsSchema = z.object({ permissions: permissionsSchema });

export const familyAcceptSchema = z.object({
  name: z.string().trim().min(2).max(120),
  password: z.string().min(8).max(128)
});

export const forumPostSchema = z.object({
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(10000),
  tags: z.array(z.enum(['support', 'recovery', 'feeding', 'sleep', 'mood', 'new-parent'])).max(6).default([]),
  isAnonymous: z.boolean().default(false)
});

export const forumCommentSchema = z.object({
  body: z.string().trim().min(1).max(4000)
});

export const forumReportSchema = z.object({
  targetType: z.enum(['post', 'comment']),
  targetId: z.string().min(1),
  reason: z.string().trim().min(1).max(1000)
});

export const lactationBookingSchema = z.object({
  consultantId: z.string().min(1),
  slotStart: z.string().datetime(),
  mode: z.enum(['video', 'in-person']),
  reason: z.string().max(1000).default('')
});

export const escalationSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
  severity: z.enum(['low', 'moderate', 'high', 'critical'])
});

export const messageSchema = z.object({
  text: z.string().trim().min(1).max(4000)
});

export const escalationStatusSchema = z.object({
  status: z.enum(['acknowledged', 'in-progress', 'resolved'])
});

export const doctorSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(254),
  password: z.string().min(12).max(128)
});

export const userStatusSchema = z.object({ isActive: z.boolean() });

export const moderationSchema = z.object({
  action: z.enum(['hide', 'warn', 'dismiss']),
  kind: z.enum(['report', 'flag'])
});
