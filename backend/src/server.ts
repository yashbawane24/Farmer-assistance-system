import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorMiddleware';

// Load environment variables
dotenv.config();

// Validate required environment variables at startup
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`[CRITICAL] Server startup failed. Missing environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Connect to MongoDB Database
connectDB();

const app = express();

// Secure headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading local uploads from frontend
}));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5001',
  'https://farmer-assistance-system-beta.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    // In development, allow everything
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // In production, check against allowed origins
    const isAllowed = allowedOrigins.some(allowed => {
      return origin === allowed || origin.endsWith('.vercel.app');
    });
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Express request parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local upload files for disease diagnosis mock fallback
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', limiter);

// Route Declarations
import authRoutes from './routes/authRoutes';
import weatherRoutes from './routes/weatherRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import diseaseRoutes from './routes/diseaseRoutes';
import marketRoutes from './routes/marketRoutes';
import schemeRoutes from './routes/schemeRoutes';
import notificationRoutes from './routes/notificationRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import adminRoutes from './routes/adminRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/diseases', diseaseRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);

// Base Route
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Smart Farmer Assistance System REST API'
  });
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5001', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server executing in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
