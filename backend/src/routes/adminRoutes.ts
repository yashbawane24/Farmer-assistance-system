import { Router } from 'express';
import {
  getAnalytics,
  manageFarmers,
  deleteFarmer,
  addScheme,
  updateScheme,
  deleteScheme,
  addMarketPrice,
  updateMarketPrice,
  deleteMarketPrice,
  broadcastNotification
} from '../controllers/adminController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = Router();

// Apply admin access checks to all endpoints in this router
router.use(protect);
router.use(adminOnly);

router.get('/analytics', getAnalytics);
router.get('/farmers', manageFarmers);
router.delete('/farmers/:id', deleteFarmer);

router.post('/schemes', addScheme);
router.put('/schemes/:id', updateScheme);
router.delete('/schemes/:id', deleteScheme);

router.post('/market-prices', addMarketPrice);
router.put('/market-prices/:id', updateMarketPrice);
router.delete('/market-prices/:id', deleteMarketPrice);

router.post('/broadcast', broadcastNotification);

export default router;
