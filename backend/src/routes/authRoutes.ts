import { Router } from 'express';
import { 
  sendOTP, 
  verifyOTP, 
  signup, 
  getProfile, 
  updateProfile, 
  toggleBookmark, 
  loginWithPassword,
  register,
  verifyRegisterOtp,
  forgotPassword,
  resetPassword
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/signup', signup);
router.post('/login', loginWithPassword);

// Modern Auth Flow Routes
router.post('/register', register);
router.post('/register/verify', verifyRegisterOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/bookmark', protect, toggleBookmark);

export default router;
