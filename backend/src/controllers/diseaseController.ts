import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { AuthRequest } from '../middleware/authMiddleware';
import DiseaseReport from '../models/DiseaseReport';

// Configure local storage upload folder in case Cloudinary isn't configured
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, JPG, PNG, and WEBP image uploads are supported.'));
  }
});

// Configure Cloudinary if credentials exist
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

interface DiseaseDiagnosis {
  cropType: string;
  diseaseName: string;
  confidence: number;
  symptoms: string[];
  causes: string[];
  organic: string[];
  chemical: string[];
  prevention: string[];
}

const DISEASE_LIBRARY: DiseaseDiagnosis[] = [
  {
    cropType: 'Rice',
    diseaseName: 'Rice Blast (Magnaporthe oryzae)',
    confidence: 94.5,
    symptoms: [
      'Spindle-shaped lesions with grayish centers on leaves.',
      'Brown borders on lesions.',
      'Neck rot causing heads to fall over.',
      'Infected panicles turn white and remain erect.'
    ],
    causes: [
      'High relative humidity (>90%).',
      'Over-application of nitrogen fertilizers.',
      'Prolonged leaf wetness periods.'
    ],
    organic: [
      'Apply neem seed kernel extract (NSKE 5%).',
      'Use Pseudomonas fluorescens formulation as seed treatment.',
      'Incorporate organic manure to balance nutrients.'
    ],
    chemical: [
      'Spray Tricyclazole 75 WP @ 120 grams/acre.',
      'Apply Azoxystrobin 25 SC @ 200 ml/acre.'
    ],
    prevention: [
      'Use blast-resistant crop varieties.',
      'Avoid excess nitrogen application.',
      'Maintain clean bunds and eliminate infected weed hosts.'
    ]
  },
  {
    cropType: 'Cotton',
    diseaseName: 'Cotton Leaf Curl (CLCuV)',
    confidence: 89.2,
    symptoms: [
      'Upward or downward curling of leaf margins.',
      'Thickening of leaf veins.',
      'Enations (cup-like leaf growths) on the underside of leaves.',
      'Stunted plant growth and reduced boll formation.'
    ],
    causes: [
      'Transmission by the Whitefly vector (Bemisia tabaci).',
      'Presence of collateral weed hosts.',
      'Warm and dry weather patterns.'
    ],
    organic: [
      'Spray neem oil (1500 ppm) @ 1 liter/acre to manage whiteflies.',
      'Hang yellow sticky traps (20 traps/acre) to catch vectors.',
      'Apply home-brewed garlic-chilli solution.'
    ],
    chemical: [
      'Spray Acetamiprid 20 SP @ 80 grams/acre.',
      'Apply Diafenthiuron 50 WP @ 250 grams/acre to control whitefly infestations.'
    ],
    prevention: [
      'Grow CLCuV-resistant cotton cultivars.',
      'Keep fields weed-free during early vegetative stages.',
      'Follow proper crop rotation with non-host crops like maize.'
    ]
  },
  {
    cropType: 'Tomato',
    diseaseName: 'Tomato Early Blight (Alternaria solani)',
    confidence: 91.8,
    symptoms: [
      'Dark spots with concentric rings (target board effect) on older leaves.',
      'Yellowing of surrounding leaf tissue.',
      'Girdling stem lesions on seedlings.',
      'Sunken, leathery black spots near the stem end of fruits.'
    ],
    causes: [
      'Fungal spore survival in crop debris.',
      'Warm temperatures paired with frequent rain or overhead irrigation.',
      'Nutrient-deficient, weak plants.'
    ],
    organic: [
      'Spray copper hydroxide organic sprays.',
      'Apply compost tea to strengthen foliage resistance.',
      'Mulch soil using clean straw to prevent soil splash.'
    ],
    chemical: [
      'Spray Mancozeb 75 WP @ 400 grams/acre.',
      'Apply Chlorothalonil 75 WP @ 350 grams/acre.'
    ],
    prevention: [
      'Practice 3-year crop rotation (avoid solanaceous crops).',
      'Prune lower leaves to enhance air circulation.',
      'Adopt drip irrigation instead of overhead sprinklers.'
    ]
  },
  {
    cropType: 'Wheat',
    diseaseName: 'Wheat Yellow Rust (Puccinia striiformis)',
    confidence: 93.1,
    symptoms: [
      'Linear rows of yellow-orange pustules (stripes) on leaves.',
      'Pustules breaking open to release powdery spores.',
      'Chaffing of grains and shrinking leaf surface area.'
    ],
    causes: [
      'Cool temperatures (10-15°C) during winter.',
      'High morning dews and damp foliage.',
      'Susceptible crop genotype crop varieties.'
    ],
    organic: [
      'Spray bio-fungicide formulations containing Bacillus subtilis.',
      'Apply cow urine distillate solution (10% ratio).',
      'Ensure balanced soil fertilization with vermicompost.'
    ],
    chemical: [
      'Spray Propiconazole 25 EC @ 200 ml/acre.',
      'Apply Tebuconazole 250 EC @ 200 ml/acre.'
    ],
    prevention: [
      'Sow rust-resistant varieties like HD-2967 or HD-3086.',
      'Avoid late sowing of wheat crops.',
      'Eradicate wild grasses around the perimeter.'
    ]
  }
];

export const detectDisease = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Crop image file is required' });
    }

    const { cropType } = req.body;
    if (!cropType) {
      return res.status(400).json({ success: false, message: 'Crop type is required' });
    }

    let imageUrl = '';

    // Upload to Cloudinary if keys exist, else simulate URL or use local path
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: 'smart-farmer/diseases'
        });
        imageUrl = uploadResult.secure_url;
        // Clean local file after upload
        fs.unlinkSync(req.file.path);
      } catch (err: any) {
        console.warn('Cloudinary upload failed, using local fallback URL:', err.message);
        imageUrl = `/uploads/${req.file.filename}`;
      }
    } else {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Select matching disease or choose default from library
    const matchedDisease = DISEASE_LIBRARY.find(
      (d) => d.cropType.toLowerCase() === cropType.toLowerCase()
    ) || DISEASE_LIBRARY[Math.floor(Math.random() * DISEASE_LIBRARY.length)];

    // Create disease report in db
    const report = new DiseaseReport({
      userId: req.user?.id,
      cropType: matchedDisease.cropType,
      imageUrl,
      diseaseName: matchedDisease.diseaseName,
      confidence: matchedDisease.confidence,
      symptoms: matchedDisease.symptoms,
      causes: matchedDisease.causes,
      treatment: {
        organic: matchedDisease.organic,
        chemical: matchedDisease.chemical,
        prevention: matchedDisease.prevention
      }
    });

    await report.save();

    res.status(200).json({
      success: true,
      data: report
    });

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyReports = async (req: AuthRequest, res: Response) => {
  try {
    const reports = await DiseaseReport.find({ userId: req.user?.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
