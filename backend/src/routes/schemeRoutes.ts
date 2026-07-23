import { Router } from 'express';
import { getSchemes, getSchemeDetails } from '../controllers/schemeController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getSchemes);
router.get('/:id', protect, getSchemeDetails);

export default router;
