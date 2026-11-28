import express from 'express';
import { auth, authorize, optionalAuth } from '../middleware/auth.js';
import {
  getActiveQuestionnaire,
  postScreening,
  getScreenings,
  getRiskStatus,
  createReminder,
  getReminders,
  patchReminder,
  completeReminder,
  removeReminder,
  getProfile,
  putProfile,
  getFamilyMembers,
  createFamilyInvite,
  acceptFamilyInvite,
  updateFamilyPermissions,
  revokeFamilyAccess,
  getFamilyDashboard,
  addFamilyLog,
  getForumPosts,
  getForumPost,
  createForumPost,
  addForumComment,
  reportForumPost,
  deleteForumPost,
  getLactationConsultants,
  getLactationSlots,
  getLactationBookings,
  createLactationBooking,
  cancelLactationBooking,
  getEscalations,
  createEscalation,
  patchEscalationStatus,
  postChatMessage,
  getNotifications,
  patchNotificationRead,
  getAdminUsers,
  patchAdminUserStatus,
  createDoctor,
  getAdminReports,
  patchAdminReport
} from '../controllers/apiController.js';

const router = express.Router();

router.get('/ppd/questionnaires/active', getActiveQuestionnaire);
router.post('/ppd/screenings', auth, authorize('mother'), postScreening);
router.get('/ppd/screenings', auth, authorize('mother'), getScreenings);
router.get('/ppd/risk-status', auth, authorize('mother'), getRiskStatus);

router.post('/reminders', auth, authorize('mother'), createReminder);
router.get('/reminders', auth, authorize('mother'), getReminders);
router.patch('/reminders/:id', auth, authorize('mother'), patchReminder);
router.post('/reminders/:id/complete', auth, authorize('mother'), completeReminder);
router.delete('/reminders/:id', auth, authorize('mother'), removeReminder);

router.get('/profile', auth, authorize('mother'), getProfile);
router.put('/profile', auth, authorize('mother'), putProfile);

router.get('/family/members', auth, authorize('mother', 'family'), getFamilyMembers);
router.post('/family/invites', auth, authorize('mother'), createFamilyInvite);
router.post('/family/invites/:token/accept', acceptFamilyInvite);
router.patch('/family/members/:id/permissions', auth, authorize('mother'), updateFamilyPermissions);
router.delete('/family/members/:id', auth, authorize('mother', 'family'), revokeFamilyAccess);
router.get('/family/mothers/:motherId/dashboard', auth, authorize('family'), getFamilyDashboard);
router.post('/family/mothers/:motherId/babies/:babyId/logs', auth, authorize('family'), addFamilyLog);

router.get('/forum/posts', optionalAuth, getForumPosts);
router.get('/forum/posts/:id', optionalAuth, getForumPost);
router.post('/forum/posts', auth, authorize('mother', 'family', 'doctor'), createForumPost);
router.post('/forum/posts/:id/comments', auth, authorize('mother', 'family', 'doctor'), addForumComment);
router.post('/forum/posts/:id/report', auth, authorize('mother', 'family', 'doctor'), reportForumPost);
router.delete('/forum/posts/:id', auth, authorize('mother', 'family', 'doctor'), deleteForumPost);

router.get('/lactation/consultants', getLactationConsultants);
router.get('/lactation/consultants/:id/slots', getLactationSlots);
router.get('/lactation/bookings', auth, authorize('mother'), getLactationBookings);
router.post('/lactation/bookings', auth, authorize('mother'), createLactationBooking);
router.patch('/lactation/bookings/:id/cancel', auth, authorize('mother'), cancelLactationBooking);

router.get('/escalations', auth, authorize('mother', 'doctor'), getEscalations);
router.post('/escalations', auth, authorize('mother'), createEscalation);
router.patch('/escalations/:id/status', auth, authorize('doctor'), patchEscalationStatus);
router.post('/chats/:id/messages', auth, authorize('mother', 'doctor'), postChatMessage);

router.get('/notifications', auth, authorize('mother', 'family', 'doctor', 'admin'), getNotifications);
router.patch('/notifications/:id/read', auth, authorize('mother', 'family', 'doctor', 'admin'), patchNotificationRead);

router.get('/admin/users', auth, authorize('admin'), getAdminUsers);
router.patch('/admin/users/:id/status', auth, authorize('admin'), patchAdminUserStatus);
router.post('/admin/doctors', auth, authorize('admin'), createDoctor);
router.get('/admin/reports', auth, authorize('admin'), getAdminReports);
router.patch('/admin/reports/:id', auth, authorize('admin'), patchAdminReport);

export default router;
