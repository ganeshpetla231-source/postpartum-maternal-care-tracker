import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import User from '../models/User.js';
import MotherProfile from '../models/MotherProfile.js';
import Baby from '../models/Baby.js';
import BabyLog from '../models/BabyLog.js';
import RecoveryMilestone from '../models/RecoveryMilestone.js';
import PPDScreening, { Questionnaire } from '../models/PPDScreening.js';
import Reminder from '../models/Reminder.js';
import FamilyAccess from '../models/FamilyAccess.js';
import ForumPost from '../models/ForumPost.js';
import ForumReport from '../models/ForumReport.js';
import LactationConsultant from '../models/LactationConsultant.js';
import LactationBooking from '../models/LactationBooking.js';
import Escalation from '../models/Escalation.js';
import ChatMessage from '../models/ChatMessage.js';
import Notification from '../models/Notification.js';
import DeidentifiedArchive from '../models/DeidentifiedArchive.js';
import { env } from '../config/env.js';
import { emitToRoom, emitToUser } from './realtime.js';
import { createBabyLog } from './phase2Service.js';

const questionnaireQuestions = [
  'Over the past seven days, how often have you felt low or down?',
  'How often have ordinary tasks felt difficult to manage?',
  'How often have you felt worried or on edge?',
  'How often have you felt sudden fear or panic?',
  'How often have you had trouble sleeping because of worry?',
  'How often have you felt alone or without enough support?',
  'How often have you had difficulty enjoying things you usually like?',
  'How often have you felt tearful or close to tears?',
  'How often have you felt overwhelmed by day-to-day demands?',
  'How often have you had thoughts of harming yourself?'
];

const scaleOptions = [
  { label: 'Not at all', score: 0 },
  { label: 'A little or rarely', score: 1 },
  { label: 'Some of the time', score: 2 },
  { label: 'Most of the time', score: 3 }
];

function httpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function cleanUser(user) {
  if (!user) return null;
  const data = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete data.passwordHash;
  return data;
}

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function createNotification(recipient, type, message, link) {
  if (!recipient) return null;
  const notification = await Notification.create({ recipient, type, message, link });
  const data = notification.toObject();
  emitToUser(recipient, 'notification:new', data);
  return data;
}

export async function activeQuestionnaire() {
  let questionnaire = await Questionnaire.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
  if (!questionnaire) {
    questionnaire = await Questionnaire.create({
      title: 'Postpartum wellbeing check-in',
      disclaimer: 'This is an unvalidated self-reflection tool, not a diagnosis or substitute for professional care.',
      isActive: true,
      questions: questionnaireQuestions.map((text, index) => ({
        id: `q${index + 1}`,
        text,
        options: scaleOptions
      }))
    });
    questionnaire = questionnaire.toObject();
  }
  return questionnaire;
}

export async function createScreening(motherId, input) {
  const questionnaire = await activeQuestionnaire();
  const expected = new Set(questionnaire.questions.map((question) => question.id));
  const supplied = new Set(input.answers.map((answer) => answer.questionId));
  if (supplied.size !== input.answers.length || supplied.size !== expected.size ||
      [...expected].some((id) => !supplied.has(id))) {
    throw httpError('Answer every questionnaire item exactly once');
  }

  const totalScore = input.answers.reduce((sum, answer) => sum + answer.score, 0);
  const selfHarmQuestion = questionnaire.questions.find((question) =>
    /harm(ing)? (myself|yourself)|hurt(ing)? (myself|yourself)/i.test(question.text)
  );
  const flaggedSelfHarm = Boolean(
    selfHarmQuestion && input.answers.find((answer) => answer.questionId === selfHarmQuestion.id)?.score > 0
  );
  const riskLevel = flaggedSelfHarm || totalScore >= 20
    ? 'critical'
    : totalScore >= 13
      ? 'high'
      : totalScore >= 8
        ? 'moderate'
        : 'low';
  const screening = await PPDScreening.create({
    mother: motherId,
    questionnaire: questionnaire._id,
    answers: input.answers,
    totalScore,
    riskLevel,
    flaggedSelfHarm
  });
  return { screening: screening.toObject(), emergencyContact: await emergencyContactFor(motherId) };
}

async function emergencyContactFor(motherId) {
  const profile = await MotherProfile.findOne({ user: motherId }).select('emergencyContact').lean();
  return profile?.emergencyContact || null;
}

export async function listScreenings(motherId, { page = 1, limit = 50 } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
  const query = { mother: motherId };
  const [items, total] = await Promise.all([
    PPDScreening.find(query).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    PPDScreening.countDocuments(query)
  ]);
  return { items, page: safePage, limit: safeLimit, total };
}

export async function getRiskStatus(motherId) {
  const latest = await PPDScreening.findOne({ mother: motherId }).sort({ createdAt: -1 }).lean();
  return { latest, emergencyContact: await emergencyContactFor(motherId) };
}

export async function createReminder(owner, input) {
  return Reminder.create({
    owner,
    ...input,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    startDate: input.startDate ? new Date(input.startDate) : new Date()
  });
}

export async function listReminders(owner, { limit = 100, page = 1 } = {}) {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 100));
  const safePage = Math.max(1, Number(page) || 1);
  const query = { owner };
  const [items, total] = await Promise.all([
    Reminder.find(query).sort({ scheduledAt: 1, createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    Reminder.countDocuments(query)
  ]);
  return { items, page: safePage, limit: safeLimit, total };
}

export async function updateReminder(owner, id, updates) {
  if (!isValidId(id)) return null;
  return Reminder.findOneAndUpdate({ _id: id, owner }, { $set: updates }, { new: true, runValidators: true }).lean();
}

export async function completeReminder(owner, id, occurrenceKey) {
  if (!isValidId(id)) return null;
  const reminder = await Reminder.findOne({ _id: id, owner });
  if (!reminder) return null;
  const key = String(occurrenceKey || new Date().toISOString()).slice(0, 100);
  if (!reminder.completionKeys.includes(key)) reminder.completionKeys.push(key);
  if (reminder.scheduleType === 'once') reminder.status = 'completed';
  await reminder.save();
  return reminder.toObject();
}

export async function deleteReminder(owner, id) {
  if (!isValidId(id)) return null;
  return Reminder.findOneAndDelete({ _id: id, owner }).lean();
}

export async function getMotherProfile(userId) {
  return MotherProfile.findOne({ user: userId }).lean() || null;
}

export async function updateMotherProfile(userId, input) {
  return MotherProfile.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      deliveryDate: input.deliveryDate || null,
      deliveryType: input.deliveryType || 'normal',
      complications: input.complications || [],
      emergencyContact: input.emergencyContact || {}
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  ).lean();
}

function publicAccess(access) {
  const record = typeof access.toObject === 'function' ? access.toObject() : { ...access };
  delete record.tokenHash;
  if (record.member) record.member = cleanUser(record.member);
  if (record.mother) record.mother = cleanUser(record.mother);
  return record;
}

export async function listFamilyAccess(user) {
  if (user.role === 'mother') {
    const records = await FamilyAccess.find({ mother: user._id }).populate('member', 'name email role').sort({ createdAt: -1 }).lean();
    return records.map(publicAccess);
  }
  const records = await FamilyAccess.find({ member: user._id, revokedAt: null })
    .populate('mother', 'name email')
    .sort({ createdAt: -1 })
    .lean();
  return records.map(publicAccess);
}

export async function inviteFamilyMember(motherId, input) {
  const email = input.email.toLowerCase();
  const existingUser = await User.findOne({ email, isDeleted: false });
  if (existingUser) throw httpError('An account already exists for this email address', 409);
  const existingInvite = await FamilyAccess.findOne({
    mother: motherId,
    email,
    member: null,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  });
  if (existingInvite) throw httpError('An active invitation already exists for this email address', 409);
  const inviteToken = crypto.randomBytes(32).toString('hex');
  const record = await FamilyAccess.create({
    mother: motherId,
    email,
    permissions: input.permissions,
    tokenHash: crypto.createHash('sha256').update(inviteToken).digest('hex'),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  const data = publicAccess(record);
  data.invitationPath = `/family/accept?token=${encodeURIComponent(inviteToken)}`;
  return data;
}

export async function acceptFamilyInvite(token, input) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = await FamilyAccess.findOne({
    tokenHash,
    member: null,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  }).select('+tokenHash');
  if (!record) throw httpError('Invitation is invalid or has expired', 404);
  const existing = await User.findOne({ email: record.email });
  if (existing) throw httpError('An account already exists for this email address', 409);

  const user = await User.create({
    name: input.name,
    email: record.email,
    passwordHash: await bcrypt.hash(input.password, 12),
    role: 'family'
  });
  record.member = user._id;
  record.acceptedAt = new Date();
  record.expiresAt = undefined;
  record.tokenHash = undefined;
  await record.save();
  const accessToken = (await import('jsonwebtoken')).default.sign(
    { sub: user._id, role: user.role },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpiresIn }
  );
  return { user: cleanUser(user), accessToken };
}

export async function updateFamilyPermissions(motherId, accessId, permissions) {
  if (!isValidId(accessId)) return null;
  const record = await FamilyAccess.findOneAndUpdate(
    { _id: accessId, mother: motherId },
    { $set: { permissions } },
    { new: true, runValidators: true }
  ).populate('member', 'name email role');
  return record ? publicAccess(record) : null;
}

export async function revokeFamilyAccess(user, accessId) {
  if (!isValidId(accessId)) return null;
  const filter = user.role === 'mother'
    ? { _id: accessId, mother: user._id }
    : { _id: accessId, member: user._id };
  const record = await FamilyAccess.findOneAndUpdate(
    filter,
    { $set: { revokedAt: new Date() } },
    { new: true }
  ).populate('member', 'name email role').populate('mother', 'name email');
  return record ? publicAccess(record) : null;
}

async function familyPermission(motherId, memberId, permission) {
  return FamilyAccess.findOne({
    mother: motherId,
    member: memberId,
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    [`permissions.${permission}`]: true
  }).lean();
}

export async function getFamilyDashboard(memberId, motherId) {
  if (!isValidId(motherId)) return null;
  const access = await FamilyAccess.findOne({
    mother: motherId,
    member: memberId,
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
  }).populate('mother', 'name').lean();
  if (!access) return null;

  const dashboard = { mother: access.mother, permissions: access.permissions, babies: [] };
  if (access.permissions.viewBabyLogs || access.permissions.logBabyData) {
    const babies = await Baby.find({ mother: motherId, isDeleted: false }).lean();
    dashboard.babies = await Promise.all(babies.map(async (baby) => ({
      ...baby,
      ...(access.permissions.viewBabyLogs
        ? { logs: await BabyLog.find({ mother: motherId, baby: baby._id, isDeleted: false }).sort({ loggedAt: -1 }).limit(50).lean() }
        : {})
    })));
  }
  if (access.permissions.viewRecovery) {
    dashboard.recoveryDataAvailable = true;
    dashboard.recentMilestones = await RecoveryMilestone.find({
      mother: motherId,
      isDeleted: false
    }).sort({ updatedAt: -1 }).limit(10).lean();
  } else {
    dashboard.recoveryDataAvailable = false;
    dashboard.recentMilestones = [];
  }
  if (access.permissions.viewMood) {
    const latest = await PPDScreening.findOne({ mother: motherId })
      .select('riskLevel createdAt')
      .sort({ createdAt: -1 })
      .lean();
    dashboard.moodSupportIndicator = latest ? {
      supportRecommended: ['moderate', 'high', 'critical'].includes(latest.riskLevel),
      updatedAt: latest.createdAt
    } : null;
  }
  return dashboard;
}

export async function addFamilyBabyLog(memberId, motherId, babyId, input) {
  const allowed = await familyPermission(motherId, memberId, 'logBabyData');
  if (!allowed) throw httpError('Family access is unavailable or does not allow logging', 403);
  return createBabyLog(motherId, babyId, input);
}

function escapedRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function presentPost(post, viewerId, includeComments = false) {
  const author = post.author && typeof post.author === 'object' ? post.author : null;
  const postAuthorId = String(author?._id || post.author);
  const ownPost = String(viewerId) === postAuthorId;
  const presented = {
    ...post,
    authorDisplay: post.isAnonymous ? 'Anonymous member' : author?.name || 'Community member',
    author: ownPost
      ? postAuthorId
      : post.isAnonymous
        ? null
        : (author ? { _id: author._id, name: author.name } : null),
    commentsCount: (post.comments || []).filter((comment) => !comment.isDeleted).length,
    comments: includeComments
      ? (post.comments || []).filter((comment) => !comment.isDeleted).map((comment) => {
        const commentAuthor = comment.author && typeof comment.author === 'object' ? comment.author : null;
        return {
          ...comment,
          authorDisplay: commentAuthor?.name || 'Community member',
          author: commentAuthor ? { _id: commentAuthor._id, name: commentAuthor.name } : comment.author
        };
      })
      : undefined
  };
  if (!includeComments) delete presented.comments;
  return presented;
}

export async function listForumPosts({ limit = 50, page = 1, search = '', tag = '', viewerId = null } = {}) {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
  const safePage = Math.max(1, Number(page) || 1);
  const query = { isHidden: false };
  if (tag) query.tags = tag;
  if (search.trim()) {
    const matcher = new RegExp(escapedRegex(search.trim()), 'i');
    query.$or = [{ title: matcher }, { body: matcher }];
  }
  const [posts, total] = await Promise.all([
    ForumPost.find(query).populate('author', 'name').sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    ForumPost.countDocuments(query)
  ]);
  return {
    items: posts.map((post) => presentPost(post, viewerId)),
    page: safePage,
    limit: safeLimit,
    total
  };
}

export async function getForumPost(id, viewerId = null) {
  if (!isValidId(id)) return null;
  const post = await ForumPost.findOne({ _id: id, isHidden: false })
    .populate('author', 'name')
    .populate('comments.author', 'name')
    .lean();
  return post ? presentPost(post, viewerId, true) : null;
}

export async function createForumPost(authorId, input) {
  const post = await ForumPost.create({ author: authorId, ...input });
  return getForumPost(post._id, authorId);
}

export async function createForumComment(authorId, postId, body) {
  if (!isValidId(postId)) return null;
  const post = await ForumPost.findOne({ _id: postId, isHidden: false });
  if (!post) return null;
  post.comments.push({ author: authorId, body });
  await post.save();
  return getForumPost(postId, authorId);
}

export async function reportForumContent(reporterId, postId, input) {
  if (!isValidId(postId) || !isValidId(input.targetId)) return null;
  const post = await ForumPost.findOne({ _id: postId, isHidden: false });
  if (!post) return null;
  if (input.targetType === 'comment' &&
      !post.comments.some((comment) => String(comment._id) === input.targetId && !comment.isDeleted)) {
    return null;
  }
  return ForumReport.create({
    reporter: reporterId,
    post: postId,
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason
  });
}

export async function deleteForumPost(authorId, postId) {
  if (!isValidId(postId)) return null;
  return ForumPost.findOneAndDelete({ _id: postId, author: authorId }).lean();
}

function localTimeAsUtc(dateString, timeString, timeZone) {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  const targetUtc = Date.UTC(year, month - 1, day, hours, minutes);
  let candidate = targetUtc;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const values = Object.fromEntries(formatter.formatToParts(new Date(candidate))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]));
    const asUtc = Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute);
    candidate += targetUtc - asUtc;
  }
  return new Date(candidate);
}

export async function listLactationConsultants(language = '') {
  const query = { isActive: true };
  if (language.trim()) query.languages = new RegExp(`^${escapedRegex(language.trim())}$`, 'i');
  return LactationConsultant.find(query)
    .select('name qualification bio languages timezone fee availableDays startTime endTime slotDurationMinutes')
    .sort({ name: 1 })
    .lean();
}

export async function getLactationSlots(consultantId, dateString) {
  if (!isValidId(consultantId)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || '')) throw httpError('Date must use YYYY-MM-DD');
  const consultant = await LactationConsultant.findOne({ _id: consultantId, isActive: true }).lean();
  if (!consultant) return null;
  let weekday;
  try {
    weekday = new Date(`${dateString}T00:00:00.000Z`).getUTCDay();
    new Intl.DateTimeFormat('en', { timeZone: consultant.timezone }).format(new Date());
  } catch {
    throw httpError('Consultant timezone is invalid');
  }
  const nextDate = new Date(`${dateString}T00:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const dayStart = localTimeAsUtc(dateString, '00:00', consultant.timezone);
  const dayEnd = localTimeAsUtc(nextDate.toISOString().slice(0, 10), '00:00', consultant.timezone);
  const booked = await LactationBooking.find({
    consultant: consultantId,
    slotStart: { $gte: dayStart, $lt: dayEnd },
    status: 'booked'
  }).select('slotStart').lean();
  const bookedStarts = new Set(booked.map((item) => item.slotStart.getTime()));
  const slots = [];
  if ((consultant.availableDays || []).includes(weekday)) {
    const [startHour, startMinute] = consultant.startTime.split(':').map(Number);
    const [endHour, endMinute] = consultant.endTime.split(':').map(Number);
    const duration = consultant.slotDurationMinutes || 60;
    for (let minute = startHour * 60 + startMinute; minute + duration <= endHour * 60 + endMinute; minute += duration) {
      const time = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
      const slotStart = localTimeAsUtc(dateString, time, consultant.timezone);
      if (slotStart.getTime() <= Date.now() || bookedStarts.has(slotStart.getTime())) continue;
      slots.push({ slotStart: slotStart.toISOString(), localTime: time });
    }
  }
  return { consultant, slots };
}

export async function listLactationBookings(motherId) {
  return LactationBooking.find({ mother: motherId })
    .populate('consultant', 'name qualification timezone')
    .sort({ slotStart: -1 })
    .lean();
}

export async function createLactationBooking(motherId, input) {
  const slotStart = new Date(input.slotStart);
  const consultant = await LactationConsultant.findOne({ _id: input.consultantId, isActive: true }).lean();
  if (!consultant) throw httpError('Consultant not found', 404);
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: consultant.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(slotStart);
  const localDateParts = Object.fromEntries(dateParts
    .filter((part) => part.type !== 'literal')
    .map((part) => [part.type, part.value]));
  const date = `${localDateParts.year}-${localDateParts.month}-${localDateParts.day}`;
  const available = await getLactationSlots(input.consultantId, date);
  if (!available) throw httpError('Consultant not found', 404);
  if (!available.slots.some((slot) => new Date(slot.slotStart).getTime() === slotStart.getTime())) {
    throw httpError('The selected appointment slot is no longer available', 409);
  }
  const slotEnd = new Date(slotStart.getTime() + (consultant.slotDurationMinutes || 60) * 60000);
  let booking;
  try {
    booking = await LactationBooking.create({
      mother: motherId,
      consultant: consultant._id,
      slotStart,
      slotEnd,
      mode: input.mode,
      reason: input.reason
    });
  } catch (error) {
    if (error.code === 11000) throw httpError('The selected appointment slot is no longer available', 409);
    throw error;
  }
  await Reminder.create({
    owner: motherId,
    type: 'appointment',
    title: `Lactation consultation with ${consultant.name}`,
    scheduleType: 'once',
    scheduledAt: slotStart,
    startDate: new Date(),
    timezone: consultant.timezone,
    status: 'active'
  });
  return LactationBooking.findById(booking._id).populate('consultant', 'name qualification timezone').lean();
}

export async function cancelLactationBooking(motherId, bookingId) {
  if (!isValidId(bookingId)) return null;
  return LactationBooking.findOneAndUpdate(
    { _id: bookingId, mother: motherId, status: 'booked' },
    { $set: { status: 'cancelled' } },
    { new: true }
  ).populate('consultant', 'name qualification timezone').lean();
}

async function patientSummary(motherId) {
  const [latestScreening, recentMilestones] = await Promise.all([
    PPDScreening.findOne({ mother: motherId })
      .select('totalScore riskLevel createdAt flaggedSelfHarm')
      .sort({ createdAt: -1 })
      .lean(),
    RecoveryMilestone.find({ mother: motherId, isDeleted: false })
      .select('title status painLevel')
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean()
  ]);
  return {
    latestScreening,
    recentMilestones,
    recoveryDataAvailable: recentMilestones.length > 0
  };
}

async function escalationForParticipant(user, id) {
  if (!isValidId(id)) return null;
  const query = user.role === 'mother'
    ? { _id: id, mother: user._id }
    : { _id: id, doctor: user._id };
  return Escalation.findOne(query).lean();
}

export async function listEscalations(user) {
  const filter = user.role === 'mother' ? { mother: user._id } : { doctor: user._id };
  const entries = await Escalation.find(filter).sort({ updatedAt: -1 }).lean();
  return Promise.all(entries.map(async (entry) => ({
    ...entry,
    ...(user.role === 'doctor' ? { patientSummary: await patientSummary(entry.mother) } : {}),
    unreadCount: await ChatMessage.countDocuments({
      escalation: entry._id,
      sender: { $ne: user._id },
      readBy: { $ne: user._id }
    })
  })));
}

export async function createEscalation(motherId, input) {
  const profile = await MotherProfile.findOne({ user: motherId }).select('doctor').lean();
  let doctor = profile?.doctor;
  if (doctor) {
    const assigned = await User.findOne({ _id: doctor, role: 'doctor', isActive: true, isVerified: true }).select('_id').lean();
    doctor = assigned?._id;
  }
  if (!doctor) {
    const availableDoctor = await User.findOne({ role: 'doctor', isActive: true, isVerified: true })
      .select('_id')
      .sort({ createdAt: 1 })
      .lean();
    doctor = availableDoctor?._id;
  }
  const escalation = await Escalation.create({ mother: motherId, doctor, ...input });
  if (doctor) {
    await createNotification(doctor, 'care-concern', 'A patient has sent a care concern.', '/escalations');
  }
  return { ...escalation.toObject(), unreadCount: 0 };
}

export async function updateEscalationStatus(doctorId, escalationId, status) {
  if (!isValidId(escalationId)) return null;
  const escalation = await Escalation.findOneAndUpdate(
    { _id: escalationId, doctor: doctorId },
    { $set: { status } },
    { new: true, runValidators: true }
  ).lean();
  if (!escalation) return null;
  emitToRoom(`escalation:${escalation._id}`, 'escalation:updated', escalation);
  return { ...escalation, unreadCount: 0 };
}

export async function sendChatMessage(user, escalationId, text) {
  const escalation = await escalationForParticipant(user, escalationId);
  if (!escalation) return null;
  const message = await ChatMessage.create({
    escalation: escalationId,
    sender: user._id,
    senderRole: user.role,
    text,
    readBy: [user._id]
  });
  await Escalation.updateOne({ _id: escalationId }, { $set: { updatedAt: new Date() } });
  const data = message.toObject();
  emitToRoom(`escalation:${escalationId}`, 'message:new', data);
  if (user.role === 'mother' && escalation.doctor) {
    await createNotification(escalation.doctor, 'care-message', 'You have a new care-team message.', '/escalations');
  } else if (user.role === 'doctor') {
    await createNotification(escalation.mother, 'care-message', 'You have a new care-team message.', '/escalations');
  }
  return data;
}

export async function joinEscalationRoom(user, escalationId) {
  const escalation = await escalationForParticipant(user, escalationId);
  if (!escalation) return null;
  const unread = await ChatMessage.find({
    escalation: escalationId,
    sender: { $ne: user._id },
    readBy: { $ne: user._id }
  }).select('_id').lean();
  if (unread.length) {
    await ChatMessage.updateMany(
      { _id: { $in: unread.map((message) => message._id) } },
      { $addToSet: { readBy: user._id } }
    );
    emitToRoom(`escalation:${escalationId}`, 'message:read', {
      escalationId: String(escalationId),
      readerId: String(user._id)
    });
  }
  const history = await ChatMessage.find({ escalation: escalationId })
    .sort({ createdAt: 1 })
    .limit(500)
    .lean();
  return { history: { items: history } };
}

export async function getNotifications(userId, { limit = 10, page = 1 } = {}) {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));
  const safePage = Math.max(1, Number(page) || 1);
  const [items, unreadCount] = await Promise.all([
    Notification.find({ recipient: userId }).sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    Notification.countDocuments({ recipient: userId, isRead: false })
  ]);
  return { items, unreadCount, page: safePage, limit: safeLimit };
}

export async function markNotificationRead(userId, notificationId) {
  if (!isValidId(notificationId)) return null;
  return Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { isRead: true } },
    { new: true }
  ).lean();
}

export async function listAdminUsers({ limit = 100, page = 1, search = '', role = '', status = '' } = {}) {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 100));
  const safePage = Math.max(1, Number(page) || 1);
  const query = { isDeleted: false };
  if (role) query.role = role;
  if (status === 'active') query.isActive = true;
  if (status === 'inactive') query.isActive = false;
  if (search.trim()) {
    const matcher = new RegExp(escapedRegex(search.trim()), 'i');
    query.$or = [{ name: matcher }, { email: matcher }];
  }
  const [items, total] = await Promise.all([
    User.find(query).select('name email role isActive isVerified createdAt').sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    User.countDocuments(query)
  ]);
  return { items, page: safePage, limit: safeLimit, total };
}

export async function setUserStatus(adminId, userId, isActive) {
  if (!isValidId(userId) || String(userId) === String(adminId)) return null;
  return User.findOneAndUpdate(
    { _id: userId, role: { $ne: 'admin' }, isDeleted: false },
    { $set: { isActive } },
    { new: true }
  ).select('name email role isActive isVerified').lean();
}

export async function createDoctorAccount(input) {
  const email = input.email.toLowerCase();
  if (await User.exists({ email })) throw httpError('An account already exists for this email address', 409);
  const user = await User.create({
    name: input.name,
    email,
    passwordHash: await bcrypt.hash(input.password, 12),
    role: 'doctor',
    isVerified: true
  });
  return cleanUser(user);
}

async function reportContent(report) {
  const post = await ForumPost.findById(report.post).populate('author', 'name').lean();
  if (!post) return null;
  let content = {
    ...post,
    author: post.author,
    text: post.body,
    isAnonymous: post.isAnonymous
  };
  if (report.targetType === 'comment') {
    const comment = post.comments.find((item) => String(item._id) === String(report.targetId));
    if (comment) {
      const author = await User.findById(comment.author).select('name').lean();
      content = { ...content, text: comment.body, author };
    }
  }
  return content;
}

export async function listModerationQueue({ limit = 100, page = 1 } = {}) {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 100));
  const safePage = Math.max(1, Number(page) || 1);
  const [reports, total] = await Promise.all([
    ForumReport.find({ status: 'open' }).populate('reporter', 'name').sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    ForumReport.countDocuments({ status: 'open' })
  ]);
  const items = [];
  for (const report of reports) {
    const content = await reportContent(report);
    if (content) items.push({ kind: 'report', report, content });
  }
  const flagged = await ForumPost.find({ flags: { $ne: [] }, isHidden: false })
    .populate('author', 'name')
    .sort({ updatedAt: -1 })
    .limit(Math.max(0, safeLimit - items.length))
    .lean();
  flagged.forEach((post) => items.push({
    kind: 'flag',
    post: {
      id: post._id,
      title: post.title,
      body: post.body,
      flags: post.flags,
      author: post.author
    }
  }));
  return { items, page: safePage, limit: safeLimit, total: total + flagged.length };
}

export async function moderateContent(adminId, targetId, input) {
  if (!isValidId(targetId)) return false;
  if (input.kind === 'report') {
    const report = await ForumReport.findOne({ _id: targetId, status: 'open' });
    if (!report) return false;
    if (input.action === 'hide') {
      await ForumPost.updateOne({ _id: report.post }, { $set: { isHidden: true } });
    } else if (input.action === 'warn') {
      const post = await ForumPost.findById(report.post).select('author').lean();
      if (post) await createNotification(post.author, 'moderation-warning', 'A moderator has reviewed content you shared.', '/forum');
    }
    report.status = 'resolved';
    report.action = input.action;
    await report.save();
    return true;
  }
  const post = await ForumPost.findById(targetId);
  if (!post) return false;
  if (input.action === 'hide') post.isHidden = true;
  if (input.action === 'dismiss') post.flags = [];
  if (input.action === 'warn') {
    await createNotification(post.author, 'moderation-warning', 'A moderator has reviewed content you shared.', '/forum');
    post.flags = [];
  }
  await post.save();
  return true;
}

async function buildUserDataExport(userId, user) {
  const [profile, screenings, reminders, familyAccess, babies, milestones, escalations] = await Promise.all([
    MotherProfile.findOne({ user: userId }).lean(),
    PPDScreening.find({ mother: userId }).lean(),
    Reminder.find({ owner: userId }).lean(),
    FamilyAccess.find({ mother: userId }).select('-tokenHash').lean(),
    Baby.find({ mother: userId }).lean(),
    RecoveryMilestone.find({ mother: userId }).lean(),
    Escalation.find({ mother: userId }).lean()
  ]);
  const babyLogs = await BabyLog.find({ mother: userId }).lean();
  const messages = await ChatMessage.find({ escalation: { $in: escalations.map((entry) => entry._id) } }).lean();
  const posts = await ForumPost.find({ author: userId }).lean();
  const data = {
    exportedAt: new Date().toISOString(),
    user: cleanUser(user),
    profile,
    screenings,
    reminders,
    familyAccess,
    babies,
    babyLogs,
    recoveryMilestones: milestones,
    escalations,
    messages,
    forumPosts: posts
  };
  return { data, escalations };
}

function summarizeForRetention(data) {
  const countsBy = (items, key) => (items || []).reduce((counts, item) => {
    const value = item[key] || 'unspecified';
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
  return {
    screeningHistory: data.screenings.map((item) => ({
      totalScore: item.totalScore,
      riskLevel: item.riskLevel,
      flaggedSelfHarm: item.flaggedSelfHarm,
      recordedAt: item.createdAt
    })),
    screeningCount: data.screenings.length,
    babyCount: data.babies.length,
    babyLogCounts: countsBy(data.babyLogs, 'type'),
    recoveryMilestoneCount: data.recoveryMilestones.length,
    recoveryStatusCounts: countsBy(data.recoveryMilestones, 'status'),
    reminderCount: data.reminders.length,
    reminderTypeCounts: countsBy(data.reminders, 'type'),
    careConcernCount: data.escalations.length,
    careConcernSeverityCounts: countsBy(data.escalations, 'severity'),
    archivedAt: new Date()
  };
}

export async function exportUserData(userId) {
  const user = await User.findOne({ _id: userId, isDeleted: false });
  if (!user) throw httpError('User not found', 404);
  const { data } = await buildUserDataExport(userId, user);
  return data;
}

export async function exportAndDeleteAccount(userId, password) {
  const user = await User.findOne({ _id: userId, role: 'mother', isDeleted: false });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw httpError('Current password is incorrect', 401);
  }
  const { data, escalations } = await buildUserDataExport(userId, user);
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 7);
  await DeidentifiedArchive.create({
    archiveId: crypto.randomUUID(),
    data: summarizeForRetention(data),
    expiresAt
  });

  await Promise.all([
    MotherProfile.deleteMany({ user: userId }),
    PPDScreening.deleteMany({ mother: userId }),
    Reminder.deleteMany({ owner: userId }),
    FamilyAccess.deleteMany({ $or: [{ mother: userId }, { member: userId }] }),
    BabyLog.deleteMany({ mother: userId }),
    Baby.deleteMany({ mother: userId }),
    RecoveryMilestone.deleteMany({ mother: userId }),
    ChatMessage.deleteMany({ escalation: { $in: escalations.map((entry) => entry._id) } }),
    Escalation.deleteMany({ $or: [{ mother: userId }, { doctor: userId }] }),
    Notification.deleteMany({ recipient: userId }),
    ForumPost.deleteMany({ author: userId }),
    ForumReport.deleteMany({ reporter: userId }),
    User.deleteOne({ _id: userId })
  ]);
  return data;
}



