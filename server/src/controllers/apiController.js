import { z } from 'zod';
import * as service from '../services/apiService.js';
import {
  screeningSchema,
  reminderSchema,
  reminderUpdateSchema,
  familyInviteSchema,
  familyPermissionsSchema,
  familyAcceptSchema,
  forumPostSchema,
  forumCommentSchema,
  forumReportSchema,
  lactationBookingSchema,
  escalationSchema,
  messageSchema,
  escalationStatusSchema,
  doctorSchema,
  userStatusSchema,
  moderationSchema
} from '../validators/api.js';
import { profileSchema } from '../validators/auth.js';
import { babyLogSchema } from '../validators/phase2.js';

function respond(res, status, data, message) {
  return res.status(status).json({ success: true, data, message, errors: [] });
}

function validationError(res, error) {
  return res.status(400).json({
    success: false,
    data: null,
    message: 'Validation failed',
    errors: error.issues.map((issue) => issue.message)
  });
}

async function handle(res, next, operation) {
  try {
    const result = await operation();
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) return validationError(res, error);
    return next(error);
  }
}

function notFound(res, message) {
  return res.status(404).json({ success: false, data: null, message, errors: [message] });
}

export function getActiveQuestionnaire(req, res, next) {
  return handle(res, next, async () =>
    respond(res, 200, await service.activeQuestionnaire(), 'Active questionnaire fetched'));
}

export function postScreening(req, res, next) {
  return handle(res, next, async () => {
    const input = screeningSchema.parse(req.body);
    return respond(res, 201, await service.createScreening(req.user._id, input), 'Screening saved');
  });
}

export function getScreenings(req, res, next) {
  return handle(res, next, async () =>
    respond(res, 200, await service.listScreenings(req.user._id, req.query), 'Screenings fetched'));
}

export function getRiskStatus(req, res, next) {
  return handle(res, next, async () =>
    respond(res, 200, await service.getRiskStatus(req.user._id), 'Risk status fetched'));
}

export function createReminder(req, res, next) {
  return handle(res, next, async () => {
    const input = reminderSchema.parse(req.body);
    return respond(res, 201, await service.createReminder(req.user._id, input), 'Reminder created');
  });
}

export function getReminders(req, res, next) {
  return handle(res, next, async () =>
    respond(res, 200, await service.listReminders(req.user._id, req.query), 'Reminders fetched'));
}

export function patchReminder(req, res, next) {
  return handle(res, next, async () => {
    const updates = reminderUpdateSchema.parse(req.body);
    const reminder = await service.updateReminder(req.user._id, req.params.id, updates);
    return reminder ? respond(res, 200, reminder, 'Reminder updated') : notFound(res, 'Reminder not found');
  });
}

export function completeReminder(req, res, next) {
  return handle(res, next, async () => {
    const reminder = await service.completeReminder(req.user._id, req.params.id, req.body.occurrenceKey);
    return reminder ? respond(res, 200, reminder, 'Reminder completion recorded') : notFound(res, 'Reminder not found');
  });
}

export function removeReminder(req, res, next) {
  return handle(res, next, async () => {
    const reminder = await service.deleteReminder(req.user._id, req.params.id);
    return reminder ? respond(res, 200, reminder, 'Reminder deleted') : notFound(res, 'Reminder not found');
  });
}

export function getProfile(req, res, next) {
  return handle(res, next, async () => {
    const profile = await service.getMotherProfile(req.user._id);
    return respond(res, 200, profile || {
      deliveryDate: null,
      deliveryType: 'normal',
      complications: [],
      emergencyContact: {}
    }, 'Profile fetched');
  });
}

export function putProfile(req, res, next) {
  return handle(res, next, async () => {
    const input = profileSchema.parse(req.body);
    const profile = await service.updateMotherProfile(req.user._id, input);
    return respond(res, 200, profile, 'Profile updated');
  });
}

export function getFamilyMembers(req, res, next) {
  return handle(res, next, async () =>
    respond(res, 200, await service.listFamilyAccess(req.user), 'Family access fetched'));
}

export function createFamilyInvite(req, res, next) {
  return handle(res, next, async () => {
    const input = familyInviteSchema.parse(req.body);
    const invite = await service.inviteFamilyMember(req.user._id, input);
    return respond(res, 201, invite, 'Invitation created');
  });
}

export function acceptFamilyInvite(req, res, next) {
  return handle(res, next, async () => {
    const input = familyAcceptSchema.parse(req.body);
    const result = await service.acceptFamilyInvite(req.params.token, input);
    return respond(res, 201, result, 'Invitation accepted');
  });
}

export function updateFamilyPermissions(req, res, next) {
  return handle(res, next, async () => {
    const { permissions } = familyPermissionsSchema.parse(req.body);
    const access = await service.updateFamilyPermissions(req.user._id, req.params.id, permissions);
    return access ? respond(res, 200, access, 'Family permissions updated') : notFound(res, 'Family access not found');
  });
}

export function revokeFamilyAccess(req, res, next) {
  return handle(res, next, async () => {
    const access = await service.revokeFamilyAccess(req.user, req.params.id);
    return access ? respond(res, 200, access, 'Family access revoked') : notFound(res, 'Family access not found');
  });
}

export function getFamilyDashboard(req, res, next) {
  return handle(res, next, async () => {
    const dashboard = await service.getFamilyDashboard(req.user._id, req.params.motherId);
    return dashboard ? respond(res, 200, dashboard, 'Shared dashboard fetched') : notFound(res, 'Shared dashboard not found');
  });
}

export function addFamilyLog(req, res, next) {
  return handle(res, next, async () => {
    const input = babyLogSchema.parse(req.body);
    const log = await service.addFamilyBabyLog(req.user._id, req.params.motherId, req.params.babyId, input);
    return respond(res, 201, log, 'Baby log added');
  });
}

export function getForumPosts(req, res, next) {
  return handle(res, next, async () =>
    respond(res, 200, await service.listForumPosts({ ...req.query, viewerId: req.user?._id }), 'Forum posts fetched'));
}

export function getForumPost(req, res, next) {
  return handle(res, next, async () => {
    const post = await service.getForumPost(req.params.id, req.user?._id);
    return post ? respond(res, 200, post, 'Forum post fetched') : notFound(res, 'Forum post not found');
  });
}

export function createForumPost(req, res, next) {
  return handle(res, next, async () => {
    const input = forumPostSchema.parse(req.body);
    return respond(res, 201, await service.createForumPost(req.user._id, input), 'Forum post created');
  });
}

export function addForumComment(req, res, next) {
  return handle(res, next, async () => {
    const { body } = forumCommentSchema.parse(req.body);
    const post = await service.createForumComment(req.user._id, req.params.id, body);
    return post ? respond(res, 201, post, 'Comment added') : notFound(res, 'Forum post not found');
  });
}

export function reportForumPost(req, res, next) {
  return handle(res, next, async () => {
    const input = forumReportSchema.parse(req.body);
    const report = await service.reportForumContent(req.user._id, req.params.id, input);
    return report ? respond(res, 201, report, 'Report submitted') : notFound(res, 'Forum content not found');
  });
}

export function deleteForumPost(req, res, next) {
  return handle(res, next, async () => {
    const post = await service.deleteForumPost(req.user._id, req.params.id);
    return post ? respond(res, 200, post, 'Forum post deleted') : notFound(res, 'Forum post not found');
  });
}

export function getLactationConsultants(req, res, next) {
  return handle(res, next, async () =>
    respond(res, 200, await service.listLactationConsultants(req.query.language || ''), 'Consultants fetched'));
}

export function getLactationSlots(req, res, next) {
  return handle(res, next, async () => {
    const result = await service.getLactationSlots(req.params.id, req.query.date);
    return result ? respond(res, 200, { slots: result.slots }, 'Available slots fetched') : notFound(res, 'Consultant not found');
  });
}

export function getLactationBookings(req, res, next) {
  return handle(res, next, async () =>
    respond(res, 200, await service.listLactationBookings(req.user._id), 'Bookings fetched'));
}

export function createLactationBooking(req, res, next) {
  return handle(res, next, async () => {
    const input = lactationBookingSchema.parse(req.body);
    return respond(res, 201, await service.createLactationBooking(req.user._id, input), 'Consultation booked');
  });
}

export function cancelLactationBooking(req, res, next) {
  return handle(res, next, async () => {
    const booking = await service.cancelLactationBooking(req.user._id, req.params.id);
    return booking ? respond(res, 200, booking, 'Booking cancelled') : notFound(res, 'Booking not found');
  });
}

export function getEscalations(req, res, next) {
  return handle(res, next, async () =>
    respond(res, 200, { items: await service.listEscalations(req.user) }, 'Care concerns fetched'));
}

export function createEscalation(req, res, next) {
  return handle(res, next, async () => {
    const input = escalationSchema.parse(req.body);
    return respond(res, 201, await service.createEscalation(req.user._id, input), 'Care concern sent');
  });
}

export function patchEscalationStatus(req, res, next) {
  return handle(res, next, async () => {
    const { status } = escalationStatusSchema.parse(req.body);
    const escalation = await service.updateEscalationStatus(req.user._id, req.params.id, status);
    return escalation ? respond(res, 200, escalation, 'Care concern updated') : notFound(res, 'Care concern not found');
  });
}

export function postChatMessage(req, res, next) {
  return handle(res, next, async () => {
    const { text } = messageSchema.parse(req.body);
    const message = await service.sendChatMessage(req.user, req.params.id, text);
    return message ? respond(res, 201, message, 'Message sent') : notFound(res, 'Care conversation not found');
  });
}

export function getNotifications(req, res, next) {
  return handle(res, next, async () =>
    respond(res, 200, await service.getNotifications(req.user._id, req.query), 'Notifications fetched'));
}

export function patchNotificationRead(req, res, next) {
  return handle(res, next, async () => {
    const notification = await service.markNotificationRead(req.user._id, req.params.id);
    return notification ? respond(res, 200, notification, 'Notification marked read') : notFound(res, 'Notification not found');
  });
}

export function getAdminUsers(req, res, next) {
  return handle(res, next, async () =>
    respond(res, 200, await service.listAdminUsers(req.query), 'Users fetched'));
}

export function patchAdminUserStatus(req, res, next) {
  return handle(res, next, async () => {
    const { isActive } = userStatusSchema.parse(req.body);
    const user = await service.setUserStatus(req.user._id, req.params.id, isActive);
    return user ? respond(res, 200, user, 'User status updated') : notFound(res, 'User not found');
  });
}

export function createDoctor(req, res, next) {
  return handle(res, next, async () => {
    const input = doctorSchema.parse(req.body);
    return respond(res, 201, await service.createDoctorAccount(input), 'Doctor account created');
  });
}

export function getAdminReports(req, res, next) {
  return handle(res, next, async () =>
    respond(res, 200, await service.listModerationQueue(req.query), 'Moderation queue fetched'));
}

export function patchAdminReport(req, res, next) {
  return handle(res, next, async () => {
    const input = moderationSchema.parse(req.body);
    const updated = await service.moderateContent(req.user._id, req.params.id, input);
    return updated ? respond(res, 200, { updated: true }, 'Moderation action applied') : notFound(res, 'Moderation item not found');
  });
}

export function exportUserData(req, res, next) {
  return handle(res, next, async () => {
    const result = await service.exportUserData(req.user._id);
    return respond(res, 200, result, 'Account data exported');
  });
}

export function downloadAndDeleteAccount(req, res, next) {
  return handle(res, next, async () => {
    const result = await service.exportAndDeleteAccount(req.user._id, req.body?.password);
    const body = JSON.stringify({
      success: true,
      data: result,
      message: 'Account data exported and identity deleted',
      errors: []
    });
    return res.status(200).type('application/json').attachment('postpartum-health-data-export.json').send(body);
  });
}
