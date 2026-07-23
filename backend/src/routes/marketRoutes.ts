import { Router } from 'express';
import { getPrices, getPriceDetails, getPriceComparison } from '../controllers/marketController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getPrices);
router.get('/compare', protect, getPriceComparison);
router.get('/:id', protect, getPriceDetails);

export default router;
