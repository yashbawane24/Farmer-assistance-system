# Installation and Setup Guide - Gmail SMTP OTP Email Delivery

This document guides you through setting up real email OTP verification using Gmail SMTP and Nodemailer for the **Smart Farmer Assistance System**.

---

## 1. Gmail SMTP Credentials Setup

To send actual emails from your Gmail account, you must configure a secure Google App Password instead of using your primary login password.

### Step-by-Step Instructions:
1. Go to your [Google Account Console](https://myaccount.google.com/).
2. On the left navigation panel, click **Security**.
3. Under the **"Signing in to Google"** section, verify that **2-Step Verification** is enabled. If not, follow the instructions to enable it.
4. Once 2-Step Verification is active, search for or click on **App Passwords** (you can use search bar at the top or find it inside "2-Step Verification" settings).
5. Enter a custom app name (e.g., `Smart Farmer System`) and click **Create**.
6. Google will generate a **16-character passcode** (usually displayed in a yellow box, formatted like `xxxx xxxx xxxx xxxx`).
7. Copy this passcode (without spaces) immediately, as it is only displayed once.

---

## 2. Environment Configuration

1. In the `backend` directory, open the `.env` file (create it if it does not exist by copying `.env.example`).
2. Add/modify the following parameters:
   ```env
   # Nodemailer Gmail SMTP Configuration
   EMAIL_USER=your-actual-gmail-address@gmail.com
   EMAIL_PASS=your16characterapppasscode
   ```
3. Save the `.env` file.

---

## 3. Database Seeding

To verify changes and load the system's static assets, mandis, and default demo accounts:
```bash
cd backend
npm run seed
```

This registers the following users with mock passwords for quick fallback login:
- **System Admin:** `9999999999` (Email: `admin@farmer.com` | Password: `admin123`)
- **Demonstration Farmer:** `9876543210` (Email: `ramesh@farmer.com` | Password: `farmer123`)

---

## 4. Run the Project

Open two separate terminal windows in the project root:

### Window 1 (Backend Server)
```bash
cd backend
npm install
npm run dev
```
*Listens on `http://localhost:5001/`*

### Window 2 (Frontend React Client)
```bash
cd frontend
npm install
npm run dev
```
*Listens on `http://localhost:3000/`*

---

## 5. Security Architecture Features

- **Hashed OTP Storage:** OTP codes are hashed via SHA-256 before being stored in the database.
- **Auto-Expiration:** Active OTP records automatically delete 5 minutes after creation via MongoDB TTL indexes.
- **Strict Verification Limits:** If a user submits incorrect verification codes 5 times, the active OTP session is permanently deleted to protect against brute-force attacks.
- **Request Cooldowns:** Enforces a 60-second cooldown timer on frontend resends and database request logs.
- **Hourly Limits:** Limits users to a maximum of 5 OTP requests per hour.
