import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import { seedDatabase } from './models/seedData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIST = path.join(__dirname, '../client/dist');

const app = express();
const PORT = process.env.PORT || 5001;

// Global Middlewares
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// API Routes
app.use('/api', apiRoutes);

// Static Client Serving & SPA Fallback in Production
if (fs.existsSync(CLIENT_DIST)) {
    console.log(`📦 Production static frontend enabled: ${CLIENT_DIST}`);
    app.use(express.static(CLIENT_DIST));

    // For any GET request not handled by /api, serve the React index.html
    app.get('*', (req, res, next) => {
        if (req.originalUrl.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    });
} else {
    // Root informational endpoint when client isn't built
    app.get('/', (req, res) => {
        res.json({
            name: 'Smart Farmer Assistance System (SFAS) API',
            version: '1.0.0',
            documentation: '/docs/architecture.md',
            endpoints: '/api/health',
            team: ['Yash Bawane', 'Rohit Kundu', 'Manthan Takerkhede']
        });
    });
}

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route not found: ${req.method} ${req.originalUrl}`
        }
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: {
            code: err.code || 'INTERNAL_SERVER_ERROR',
            message: err.message || 'An unexpected agricultural processing error occurred.'
        }
    });
});

// Start Server and ensure DB seed
async function startServer() {
    try {
        await seedDatabase();
        app.listen(PORT, () => {
            console.log(`🌾 SFAS Agricultural API running at http://localhost:${PORT}`);
            console.log(`🌱 Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();
