import express from 'express';
import { auth, authorize } from '../middleware/auth.js';
import {
  createRecoveryMilestone,
  listRecoveryMilestones,
  getRecoveryMilestone,
  updateRecoveryMilestone,
  deleteRecoveryMilestone,
  createBabyController,
  listBabiesController,
  addBabyLog,
  listBabyLogsController,
  editBabyLog,
  deleteBabyLogController,
  getBabySummary
} from '../controllers/phase2Controller.js';

const router = express.Router();

router.use(auth, authorize('mother', 'family'));

router.post('/recovery/milestones', createRecoveryMilestone);
router.get('/recovery/milestones', listRecoveryMilestones);
router.get('/recovery/milestones/:id', getRecoveryMilestone);
router.patch('/recovery/milestones/:id', updateRecoveryMilestone);
router.delete('/recovery/milestones/:id', deleteRecoveryMilestone);

router.post('/babies', createBabyController);
router.get('/babies', listBabiesController);
router.post('/babies/:babyId/logs', addBabyLog);
router.get('/babies/:babyId/logs', listBabyLogsController);
router.patch('/babies/:babyId/logs/:logId', editBabyLog);
router.delete('/babies/:babyId/logs/:logId', deleteBabyLogController);
router.get('/babies/:babyId/logs/summary', getBabySummary);

export default router;
