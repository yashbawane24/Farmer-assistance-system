import { Router } from 'express';
import { detectDisease, getMyReports, upload } from '../controllers/diseaseController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/detect', protect, upload.single('image'), detectDisease);
router.get('/my-reports', protect, getMyReports);

export default router;
