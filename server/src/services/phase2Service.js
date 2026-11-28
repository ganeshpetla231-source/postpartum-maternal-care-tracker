import RecoveryMilestone from '../models/RecoveryMilestone.js';
import Baby from '../models/Baby.js';
import BabyLog from '../models/BabyLog.js';

export async function createMilestone(motherId, input) {
  return RecoveryMilestone.create({
    mother: motherId,
    title: input.title,
    category: input.category || 'physical',
    targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
    status: input.status || 'pending',
    painLevel: input.painLevel,
    notes: input.notes
  });
}

export async function listMilestones(motherId, filters = {}) {
  const query = { mother: motherId, isDeleted: false };
  if (filters.status) query.status = filters.status;
  if (filters.category) query.category = filters.category;
  if (filters.fromDate || filters.toDate) {
    query.targetDate = {};
    if (filters.fromDate) query.targetDate.$gte = new Date(filters.fromDate);
    if (filters.toDate) query.targetDate.$lte = new Date(filters.toDate);
  }

  return RecoveryMilestone.find(query).sort({ targetDate: 1 }).lean();
}

export async function getMilestoneById(motherId, milestoneId) {
  return RecoveryMilestone.findOne({ _id: milestoneId, mother: motherId, isDeleted: false }).lean();
}

export async function updateMilestone(motherId, milestoneId, input) {
  const milestone = await RecoveryMilestone.findOne({ _id: milestoneId, mother: motherId, isDeleted: false });
  if (!milestone) return null;

  if (input.status) milestone.status = input.status;
  if (input.painLevel !== undefined) milestone.painLevel = input.painLevel;
  if (input.notes !== undefined) milestone.notes = input.notes;
  if (input.targetDate) milestone.targetDate = new Date(input.targetDate);
  if (input.title) milestone.title = input.title;
  if (input.category) milestone.category = input.category;

  if (milestone.status === 'done' && !milestone.completedAt) milestone.completedAt = new Date();

  await milestone.save();
  return milestone.toObject();
}

export async function deleteMilestone(motherId, milestoneId) {
  const milestone = await RecoveryMilestone.findOne({ _id: milestoneId, mother: motherId, isDeleted: false });
  if (!milestone) return null;
  milestone.isDeleted = true;
  await milestone.save();
  return milestone.toObject();
}

export async function createBaby(motherId, input) {
  return Baby.create({ mother: motherId, ...input });
}

export async function listBabies(motherId) {
  return Baby.find({ mother: motherId, isDeleted: false }).sort({ createdAt: -1 }).lean();
}

export async function createBabyLog(motherId, babyId, input) {
  const baby = await Baby.findOne({ _id: babyId, mother: motherId, isDeleted: false });
  if (!baby) {
    const error = new Error('Baby not found');
    error.statusCode = 404;
    throw error;
  }

  if (input.type === 'sleep') {
    const start = new Date(input.sleep.start);
    const end = new Date(input.sleep.end);
    if (end <= start) {
      const error = new Error('Sleep end time must be after start time');
      error.statusCode = 400;
      throw error;
    }
  }

  return BabyLog.create({
    mother: motherId,
    baby: babyId,
    ...input,
    sleep: input.sleep ? { start: new Date(input.sleep.start), end: new Date(input.sleep.end) } : undefined,
    loggedAt: input.loggedAt
      ? new Date(input.loggedAt)
      : input.type === 'sleep'
        ? new Date(input.sleep.start)
        : new Date()
  });
}

export async function listBabyLogs(motherId, babyId, filters = {}) {
  const baby = await Baby.findOne({ _id: babyId, mother: motherId, isDeleted: false });
  if (!baby) {
    const error = new Error('Baby not found');
    error.statusCode = 404;
    throw error;
  }

  const query = { baby: babyId, mother: motherId, isDeleted: false };
  if (filters.type) query.type = filters.type;
  if (filters.fromDate || filters.toDate) {
    query.loggedAt = {};
    if (filters.fromDate) query.loggedAt.$gte = new Date(filters.fromDate);
    if (filters.toDate) query.loggedAt.$lte = new Date(filters.toDate);
  }

  return BabyLog.find(query).sort({ loggedAt: -1 }).lean();
}

export async function updateBabyLog(motherId, babyId, logId, input) {
  const log = await BabyLog.findOne({ _id: logId, baby: babyId, mother: motherId, isDeleted: false });
  if (!log) return null;

  if (input.type) log.type = input.type;
  if (input.notes !== undefined) log.notes = input.notes;
  if (input.feed) log.feed = { ...log.feed, ...input.feed };
  if (input.sleep) log.sleep = { ...log.sleep, ...input.sleep };
  if (input.diaper) log.diaper = { ...log.diaper, ...input.diaper };
  if (input.loggedAt) log.loggedAt = new Date(input.loggedAt);

  if (log.type === 'sleep' && log.sleep?.end && log.sleep.start && new Date(log.sleep.end) <= new Date(log.sleep.start)) {
    const error = new Error('Sleep end time must be after start time');
    error.statusCode = 400;
    throw error;
  }

  await log.save();
  return log.toObject();
}

export async function deleteBabyLog(motherId, babyId, logId) {
  const log = await BabyLog.findOne({ _id: logId, baby: babyId, mother: motherId, isDeleted: false });
  if (!log) return null;
  log.isDeleted = true;
  await log.save();
  return log.toObject();
}

export async function getDailySummary(motherId, babyId, date) {
  const baby = await Baby.findOne({ _id: babyId, mother: motherId, isDeleted: false });
  if (!baby) {
    const error = new Error('Baby not found');
    error.statusCode = 404;
    throw error;
  }

  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const logs = await BabyLog.find({
    baby: babyId,
    mother: motherId,
    isDeleted: false,
    $or: [
      { loggedAt: { $gte: startOfDay, $lte: endOfDay } },
      {
        type: 'sleep',
        'sleep.start': { $lte: endOfDay },
        'sleep.end': { $gte: startOfDay }
      }
    ]
  }).lean();

  let totalSleepMs = 0;
  let feedCount = 0;
  let diaperCount = 0;

  logs.forEach((log) => {
    if (log.type === 'feed') feedCount += 1;
    if (log.type === 'diaper') diaperCount += 1;
    if (log.type === 'sleep' && log.sleep?.start && log.sleep?.end) {
      const overlapStart = Math.max(new Date(log.sleep.start).getTime(), startOfDay.getTime());
      const overlapEnd = Math.min(new Date(log.sleep.end).getTime(), endOfDay.getTime());
      totalSleepMs += Math.max(0, overlapEnd - overlapStart);
    }
  });

  return {
    date,
    babyId,
    feedCount,
    diaperCount,
    feeds: feedCount,
    diapers: diaperCount,
    totalSleepMinutes: Math.round(totalSleepMs / 60000),
    totalSleepHours: +(totalSleepMs / 3600000).toFixed(2)
  };
}
