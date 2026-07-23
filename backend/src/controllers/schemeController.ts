import { Request, Response } from 'express';
import Scheme from '../models/Scheme';

export const getSchemes = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query as { category?: string; search?: string };

    const query: any = {};
    if (category && category !== 'All') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { overview: new RegExp(search, 'i') }
      ];
    }

    const schemes = await Scheme.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: schemes.length,
      data: schemes
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSchemeDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const scheme = await Scheme.findById(id);

    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Government scheme entry not found' });
    }

    res.status(200).json({
      success: true,
      data: scheme
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
