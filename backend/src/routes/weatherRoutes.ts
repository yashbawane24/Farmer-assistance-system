import { Router } from 'express';
import { getWeather } from '../controllers/weatherController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Allow public or protected access (Dashboard needs to hit this)
router.get('/', getWeather);

export default router;
