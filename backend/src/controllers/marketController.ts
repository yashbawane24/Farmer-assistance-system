import { Request, Response } from 'express';
import MarketPrice from '../models/MarketPrice';

export const getPrices = async (req: Request, res: Response) => {
  try {
    const { cropName, state, district } = req.query as { cropName?: string; state?: string; district?: string };

    const query: any = {};
    if (cropName) query.cropName = new RegExp(cropName, 'i');
    if (state) query.state = new RegExp(state, 'i');
    if (district) query.district = new RegExp(district, 'i');

    const prices = await MarketPrice.find(query).sort({ todayPrice: -1 });

    res.status(200).json({
      success: true,
      count: prices.length,
      data: prices
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPriceDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const price = await MarketPrice.findById(id);

    if (!price) {
      return res.status(404).json({ success: false, message: 'Market price entry not found' });
    }

    res.status(200).json({
      success: true,
      data: price
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPriceComparison = async (req: Request, res: Response) => {
  try {
    const { cropName } = req.query as { cropName?: string };

    if (!cropName) {
      return res.status(400).json({ success: false, message: 'Crop name parameter is required' });
    }

    // Find all markets offering prices for this crop
    const listings = await MarketPrice.find({ cropName: new RegExp(cropName, 'i') }).sort({ todayPrice: -1 });

    if (listings.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No market comparison data found for this crop',
        data: []
      });
    }

    const bestMarket = listings[0];
    const avgPrice = listings.reduce((acc, curr) => acc + curr.todayPrice, 0) / listings.length;

    res.status(200).json({
      success: true,
      cropName,
      bestMarket: {
        marketName: bestMarket.marketName,
        price: bestMarket.todayPrice,
        location: `${bestMarket.district}, ${bestMarket.state}`
      },
      averagePrice: Math.round(avgPrice),
      listings
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
