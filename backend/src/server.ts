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

// Connect to MongoDB Database
connectDB();

const app = express();

// Secure headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading local uploads from frontend
}));

// CORS Configuration
app.use(cors({
  origin: '*', // Allow all in development/major project
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// Serve frontend build static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server executing in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
