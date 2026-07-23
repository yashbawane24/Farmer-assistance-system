import { Request, Response } from 'express';
import Feedback from '../models/Feedback';
import { AuthRequest } from '../middleware/authMiddleware';

export const submitFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { name, mobile, rating, message, category } = req.body;

    if (!name || !mobile || !rating || !message) {
      return res.status(400).json({ success: false, message: 'Required feedback fields are missing' });
    }

    const feedback = new Feedback({
      userId: req.user?.id, // Can be undefined if anonymous
      name,
      mobile,
      rating: parseInt(rating),
      message,
      category: category || 'other'
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
