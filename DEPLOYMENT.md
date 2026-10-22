# Revenue Intelligence Inbox — Deployment Guide

This guide provides step-by-step instructions to deploy the **Revenue Intelligence Inbox** application to production using **Render (Backend)** and **Vercel (Frontend)**, or alternatively via **Docker**.

---

## Architecture Overview

```
[ User Browser ]
       │
       ▼
[ Vercel (Frontend: React + Vite + Tailwind) ]
       │
       │ HTTP / JSON API Requests
       ▼
[ Render (Backend: Python FastAPI + SQLite) ]
       │
       ├── Ingestion & Rule Routing Engine
       ├── SpendNest Dataset (44 Records)
       └── Cryptographic Export Generator
```

---

## Option 1: Standard Cloud Deployment (Recommended)

### Step 1: Deploy Backend to Render

1. **Sign in to Render**: Go to [render.com](https://render.com) and connect your GitHub account.
2. **Create New Web Service**:
   - Click **New +** → **Web Service**.
   - Select your GitHub repository.
3. **Configure the Web Service**:
   - **Name**: `revenue-intelligence-backend`
   - **Region**: Choose the closest region (e.g., `Oregon (US West)` or `Frankfurt (EU)`)
   - **Branch**: `main`
   - **Root Directory**: `backend` (or leave empty if using Blueprint)
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: `Free`
4. **Environment Variables**:
   Under **Environment Variables**, add:
   - `PYTHON_VERSION` = `3.11.8`
   - `APP_ENV` = `production`
5. **Click "Deploy Web Service"**:
   - Once the build succeeds, Render provides your public URL:
     `https://revenue-intelligence-backend.onrender.com`
   - Test it by visiting:
     `https://revenue-intelligence-backend.onrender.com/api/health`
     It will return:
     ```json
     {"status":"healthy","service":"Revenue Intelligence Inbox","version":"1.0.0","database":"sqlite_connected","total_source_records":44,"usable_supplied_texts":18}
     ```

---

### Step 2: Deploy Frontend to Vercel

1. **Sign in to Vercel**: Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. **Import Project**:
   - Click **Add New...** → **Project**.
   - Select your repository.
3. **Configure the Project**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click "Edit" and select **`frontend`**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Set Environment Variables**:
   In the **Environment Variables** section, add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://revenue-intelligence-backend.onrender.com/api`  
     *(Replace with your actual Render backend URL from Step 1, ensuring `/api` is at the end)*
5. **Click "Deploy"**:
   - Vercel will build the frontend assets using Tailwind CSS and Vite.
   - Client-side routing is automatically handled by the included [`frontend/vercel.json`](file:///c:/Users/kala_/OneDrive/Desktop/Revenue_Intelligent_Inbox/frontend/vercel.json).
   - Once complete, you will receive your live frontend URL (e.g. `https://revenue-intelligence-inbox.vercel.app`).

---

## Option 2: Docker / Container Deployment

If you prefer to run both backend and frontend as Docker containers on any cloud VM (DigitalOcean, AWS EC2, GCP Compute Engine, or Azure VM):

1. **Clone repository**:
   ```bash
   git clone <your-repo-url>
   cd Revenue_Intelligent_Inbox
   ```
2. **Run with Docker Compose**:
   ```bash
   docker-compose up -d --build
   ```
3. **Access the application**:
   - Frontend UI: `http://<your-server-ip>:5173`
   - Backend API: `http://<your-server-ip>:8000`
   - API Docs: `http://<your-server-ip>:8000/docs`

---

## Pre-Deployment Verification Checklist

Before pushing to production, verify all automated checks pass locally:

- [x] **Backend Tests**: Run `python -m pytest backend/tests/test_business_logic.py -v` (assert 7/7 tests pass).
- [x] **Frontend Build**: Run `npm run build` in `frontend/` (assert 0 TypeScript/CSS errors).
- [x] **Data Contract**: Verify 44 total records, 18 usable texts, and M07 override survival.
- [x] **CORS Configuration**: Confirmed `allow_origins=["*"]` in `backend/app/main.py`.
- [x] **API Base URL**: Configured with `import.meta.env.VITE_API_BASE_URL` in `frontend/src/api/client.ts`.
- [x] **Export Archive**: Confirmed generation of 11 structured files + `manifest.json`.
- [x] **Presentation & Documentation**: [`revenue_intelligence_findings.pptx`](file:///c:/Users/kala_/OneDrive/Desktop/Revenue_Intelligent_Inbox/revenue_intelligence_findings.pptx) and [`demo_script.md`](file:///c:/Users/kala_/OneDrive/Desktop/Revenue_Intelligent_Inbox/demo_script.md) present in root directory.
