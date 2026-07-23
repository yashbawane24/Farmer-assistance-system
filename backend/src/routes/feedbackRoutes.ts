import { Router } from 'express';
import { submitFeedback } from '../controllers/feedbackController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Allow optional protect or regular access for landing page feedback
router.post('/', submitFeedback);

export default router;
