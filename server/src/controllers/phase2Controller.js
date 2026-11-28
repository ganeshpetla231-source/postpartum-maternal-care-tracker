import { z } from 'zod';
import {
  createMilestone,
  listMilestones,
  getMilestoneById,
  updateMilestone,
  deleteMilestone,
  createBaby,
  listBabies,
  createBabyLog,
  listBabyLogs,
  updateBabyLog,
  deleteBabyLog,
  getDailySummary
} from '../services/phase2Service.js';
import {
  recoveryMilestoneSchema,
  babySchema,
  babyLogSchema
} from '../validators/phase2.js';

export async function createRecoveryMilestone(req, res, next) {
  try {
    const payload = recoveryMilestoneSchema.parse(req.body);
    const milestone = await createMilestone(req.user._id, payload);
    return res.status(201).json({ success: true, data: milestone, message: 'Recovery milestone created' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues.map((issue) => issue.message) });
    }
    return next(error);
  }
}

export async function listRecoveryMilestones(req, res, next) {
  try {
    const items = await listMilestones(req.user._id, {
      status: req.query.status,
      category: req.query.category,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate
    });
    return res.status(200).json({ success: true, data: items, message: 'Recovery milestones fetched' });
  } catch (error) {
    return next(error);
  }
}

export async function getRecoveryMilestone(req, res, next) {
  try {
    const milestone = await getMilestoneById(req.user._id, req.params.id);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Recovery milestone not found', errors: ['Recovery milestone not found'] });
    }
    return res.status(200).json({ success: true, data: milestone, message: 'Recovery milestone fetched' });
  } catch (error) {
    return next(error);
  }
}

export async function updateRecoveryMilestone(req, res, next) {
  try {
    const payload = recoveryMilestoneSchema.partial().parse(req.body);
    const milestone = await updateMilestone(req.user._id, req.params.id, payload);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Recovery milestone not found', errors: ['Recovery milestone not found'] });
    }
    return res.status(200).json({ success: true, data: milestone, message: 'Recovery milestone updated' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues.map((issue) => issue.message) });
    }
    return next(error);
  }
}

export async function deleteRecoveryMilestone(req, res, next) {
  try {
    const milestone = await deleteMilestone(req.user._id, req.params.id);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Recovery milestone not found', errors: ['Recovery milestone not found'] });
    }
    return res.status(200).json({ success: true, data: milestone, message: 'Recovery milestone deleted' });
  } catch (error) {
    return next(error);
  }
}

export async function createBabyController(req, res, next) {
  try {
    const payload = babySchema.parse(req.body);
    const baby = await createBaby(req.user._id, payload);
    return res.status(201).json({ success: true, data: baby, message: 'Baby created' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues.map((issue) => issue.message) });
    }
    return next(error);
  }
}

export async function listBabiesController(req, res, next) {
  try {
    const babies = await listBabies(req.user._id);
    return res.status(200).json({ success: true, data: babies, message: 'Babies fetched' });
  } catch (error) {
    return next(error);
  }
}

export async function addBabyLog(req, res, next) {
  try {
    const payload = babyLogSchema.parse(req.body);
    const log = await createBabyLog(req.user._id, req.params.babyId, payload);
    return res.status(201).json({ success: true, data: log, message: 'Baby log created' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues.map((issue) => issue.message) });
    }
    return next(error);
  }
}

export async function listBabyLogsController(req, res, next) {
  try {
    const items = await listBabyLogs(req.user._id, req.params.babyId, {
      type: req.query.type,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate
    });
    return res.status(200).json({ success: true, data: items, message: 'Baby logs fetched' });
  } catch (error) {
    return next(error);
  }
}

export async function editBabyLog(req, res, next) {
  try {
    const payload = babyLogSchema.partial().parse(req.body);
    const log = await updateBabyLog(req.user._id, req.params.babyId, req.params.logId, payload);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Baby log not found', errors: ['Baby log not found'] });
    }
    return res.status(200).json({ success: true, data: log, message: 'Baby log updated' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues.map((issue) => issue.message) });
    }
    return next(error);
  }
}

export async function deleteBabyLogController(req, res, next) {
  try {
    const log = await deleteBabyLog(req.user._id, req.params.babyId, req.params.logId);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Baby log not found', errors: ['Baby log not found'] });
    }
    return res.status(200).json({ success: true, data: log, message: 'Baby log deleted' });
  } catch (error) {
    return next(error);
  }
}

export async function getBabySummary(req, res, next) {
  try {
    const summary = await getDailySummary(req.user._id, req.params.babyId, req.query.date || new Date().toISOString());
    return res.status(200).json({ success: true, data: summary, message: 'Daily summary fetched' });
  } catch (error) {
    return next(error);
  }
}
