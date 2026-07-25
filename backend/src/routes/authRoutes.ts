import { Router } from 'express';
import { sendOTP, verifyOTP, signup, getProfile, updateProfile, toggleBookmark, loginWithPassword } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/signup', signup);
router.post('/login', loginWithPassword);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/bookmark', protect, toggleBookmark);

export default router;
