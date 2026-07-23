import { Router } from 'express';
import { getRecommendation } from '../controllers/recommendationController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect, getRecommendation);

export default router;
