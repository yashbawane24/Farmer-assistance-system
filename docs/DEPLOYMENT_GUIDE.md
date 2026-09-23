# 🚀 Smart Farmer Assistance System (SFAS) - Production Deployment Guide

This guide provides step-by-step instructions to deploy the entire SFAS platform to the internet for free.

---

## 🌟 Method 1: Single-Service Full-Stack on Render.com (Recommended)

This is the easiest, cleanest, and 100% free method. Render will host your Express backend, serve your built React client, and maintain your SQLite database in one unified place without any CORS issues.

### Step 1: Push Project to GitHub

If you haven't already committed this repository to GitHub:

1. Open your terminal in the project root:
   ```bash
   git init
   git add .
   git commit -m "feat: production deployment setup for SFAS"
   ```

2. Create a new repository on [GitHub](https://github.com/new) (e.g. `smart-farmer-assistance-system`).

3. Link and push your local code:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/smart-farmer-assistance-system.git
   git push -u origin main
   ```

---

### Step 2: Deploy on Render

1. Sign up or log into [Render.com](https://render.com) (free).
2. Click **New +** in the top right and select **Web Service**.
3. Choose **Build and deploy from a Git repository** and connect your GitHub repo.
4. Fill in the following settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `smart-farmer-assistance` (or any custom name) |
| **Region** | Singapore / Oregon / Frankfurt (closest to your users) |
| **Branch** | `main` |
| **Root Directory** | *(Leave empty)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install --prefix server && npm install --prefix client && npm run build --prefix client` |
| **Start Command** | `node server/index.js` |
| **Instance Type** | `Free` |

5. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `PORT` = `10000` *(Render automatically supplies PORT, but setting this is good practice)*

6. Click **Create Web Service**.
7. Render will automatically build the React frontend, start the Express server, seed the agricultural database, and give you a public live URL:
   `https://smart-farmer-assistance.onrender.com`

---

## ⚡ Method 2: Decoupled Deploy (Vercel Frontend + Render Backend)

If you prefer using Vercel for high-speed edge CDN delivery of the React frontend:

### Backend on Render:
1. Create a **Web Service** on Render with:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Environment Variables**:
     - `PORT` = `5001`
2. Once deployed, copy your backend URL (e.g., `https://sfas-api.onrender.com`).

### Frontend on Vercel:
1. Log into [Vercel](https://vercel.com) and click **Add New Project**.
2. Select your repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
4. Expand **Environment Variables** and add:
   - `VITE_API_URL` = `https://sfas-api.onrender.com/api`
5. Click **Deploy**. Vercel will host the frontend, querying your live Render API.

---

## 🐳 Method 3: Containerized Docker Deployment

A production-ready multi-stage `Dockerfile` is included in the project root.

### Running Locally with Docker:
```bash
# Build the production image
docker build -t sfas-fullstack .

# Run the container on port 5001
docker run -d -p 5001:5001 --name sfas-app sfas-fullstack
```
Now visit [http://localhost:5001](http://localhost:5001) in your browser.

### Deploying to Container Platforms (Railway / Fly.io / GCP Cloud Run):
- **Railway**: Connect GitHub repo, Railway detects the `Dockerfile` automatically and deploys it.
- **Fly.io**: Run `fly launch` in the project root.

---

## 🔍 Verification & Health Checks

Once deployed, verify your live URL:

1. **Frontend App**: Visit `https://<your-app-url>.onrender.com/` (Home, Crop Advisor, Mandi, Schemes, Disease Scan).
2. **API Health**: Visit `https://<your-app-url>.onrender.com/api/health` -> should return `{"success":true,"status":"UP"}`.
3. **Database Pre-seed**: Check `https://<your-app-url>.onrender.com/api/crops` -> should return the full catalogue of verified Indian crops.
4. **SPA Deep Linking**: Directly refresh `https://<your-app-url>.onrender.com/crop-advisor` to verify client-side routing fallback works properly.

---

## 🛠️ Troubleshooting

- **Server spin-down on Render Free Tier**: Free services on Render go to sleep after 15 minutes of inactivity and take ~30 seconds to wake up on the first request. You can use a free pinging service (like UptimeRobot or Cron-Job.org) pinging `/api/health` every 10 minutes to keep it active.
- **Database resets**: The SQLite database uses a local file `server/data/sfas.sqlite`. On Render free tier, server restarts will re-seed fresh authentic Indian agricultural data automatically via `seedDatabase()`. If you require persistent user notes across ephemeral container restarts in the future, you can attach a Render persistent disk or connect a Cloud PostgreSQL/Supabase database.
