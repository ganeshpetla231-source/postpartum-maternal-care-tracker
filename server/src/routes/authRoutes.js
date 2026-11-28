import express from 'express';
import {
  register,
  login,
  refresh,
  logout,
  me,
  completeProfileController
} from '../controllers/authController.js';
import { exportUserData, downloadAndDeleteAccount } from '../controllers/apiController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', auth, authorize('mother', 'family', 'doctor', 'admin'), me);
router.put('/profile', auth, authorize('mother'), completeProfileController);
router.get('/export', auth, authorize('mother', 'family', 'doctor', 'admin'), exportUserData);
router.delete('/account', auth, authorize('mother'), downloadAndDeleteAccount);

export default router;
