# Smart Farmer Assistance System

The **Smart Farmer Assistance System** is a complete, user-centered, production-ready portal engineered to help farmers make better choices by integrating:
- Real-time weather forecasts and crop advisories.
- Soil, season, and budget crop recommendations.
- AI crop leaf disease scanner with organic and chemical remedies.
- Real-time mandi rates comparisons across markets.
- Government schemes directory with bookmarking and offline capabilities.
- Voice navigation and text-to-speech assistant.
- Admin portal with charts, user lists, and broadcasts.

---

## Folder Structure

```
farmer-assistance-system/
├── frontend/                     # React + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/           # Navigation, Voice Assistant
│   │   ├── context/              # Auth, Language, Accessibility, Theme Contexts
│   │   ├── pages/                # Dashboard, Crops, Diseases, Market, Schemes
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
├── backend/                      # Node.js + Express + Mongoose Backend
│   ├── src/
│   │   ├── config/               # Database config
│   │   ├── models/               # User, Schemes, prices, notifications collections
│   │   ├── middleware/           # auth, error handler middlewares
│   │   ├── controllers/          # auth, weather, crop recommendation, disease scans
│   │   ├── routes/               # API route maps
│   │   ├── scripts/              # DB seeder script
│   │   └── server.ts             # App entrypoint
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml            # Docker container orchestration
└── README.md                     # Documentation
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account or local MongoDB instance running on `mongodb://localhost:27017`

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables:
   Create a `.env` file (copied from `.env.example`):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/smart-farmer
   JWT_SECRET=supersecretjwtkeyforfarmerassistancesystem123!
   NODE_ENV=development
   ```
4. Seed the database (installs government schemes, mandi prices, and seed accounts):
   ```bash
   npm run seed
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (runs on `http://localhost:3000` with API proxying configured):
   ```bash
   npm run dev
   ```

---

## Test Accounts

During database seeding, two demonstration accounts are created for testing purposes:

1. **System Administrator Account**:
   - Mobile: `9999999999`
   - Password: `admin123`
   
2. **Farmer Account**:
   - Mobile: `9876543210`
   - Password: `farmer123`

To sign in using these credentials, click on **"Use Password Access (Seed Accounts Test)"** at the bottom of the sign-in card.

---

## API Endpoints Documentation

### Authentication & Profile
- `POST /api/auth/send-otp` - Sends simulated OTP.
- `POST /api/auth/verify-otp` - Verifies OTP and returns JWT if profile exists.
- `POST /api/auth/signup` - Registers a new farmer profile.
- `GET /api/auth/profile` - Retrieves authenticated user profile.
- `PUT /api/auth/profile` - Updates profile parameters.
- `POST /api/auth/bookmark` - Toggles bookmarked schemes/prices.

### Core Modules
- `GET /api/weather?state=X&district=Y` - Resolves weather forecast and agronomic advisories.
- `POST /api/recommendations` - Computes recommended crops based on soil/season parameters.
- `POST /api/diseases/detect` - Analyzes uploaded crop leave images and outputs diagnosis report.
- `GET /api/market?cropName=X` - Searches mandi prices and returns trends.
- `GET /api/schemes` - Lists government subsidies and schemes.
- `GET /api/notifications` - Returns user-specific alerts and broadcasts.

### Admin Controls (JWT protected, Admin only)
- `GET /api/admin/analytics` - Pulls charts data for total users, popular crops, and diseases.
- `GET /api/admin/farmers` - Lists registered farmers profiles.
- `POST /api/admin/schemes` - Publishes a new government scheme.
- `POST /api/admin/market-prices` - Updates crop rates in a mandi.
- `POST /api/admin/broadcast` - Broadcasts a system warning alert to all dashboards.

---

## Docker Support
You can boot the entire stack (Frontend, Backend, and MongoDB Database) locally using Docker:
```bash
docker-compose up --build
```
The frontend will execute on `http://localhost:3000` and the API will bind to `http://localhost:5000`.
