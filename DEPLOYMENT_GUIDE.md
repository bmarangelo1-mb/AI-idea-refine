# Deployment Guide - AI Idea Refinery

## Backend Deployment Options

### 🚀 Option 1: Render (Recommended - Already Configured)

**Best for:** Beginners, free tier available, automatic HTTPS

**Free Tier:**
- ✅ Free tier available
- ✅ Automatic SSL certificates
- ⚠️ Spins down after 15 minutes of inactivity (wakes up on first request)
- ✅ 750 hours/month free
- ✅ PostgreSQL, Redis, and other databases available

**Setup Steps:**

1. **Create Account:**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub (recommended)

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

3. **Configure Service:**
   - **Name:** `ai-idea-refinery-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or choose paid for no spin-down)

4. **Add Environment Variables:**
   - `GEMINI_API_KEY` = `your_gemini_api_key`
   - `NODE_ENV` = `production`

5. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy
   - Get your URL: `https://your-app-name.onrender.com`

**Note:** First request after spin-down may take 30-60 seconds (cold start)

---

### 🚂 Option 2: Railway

**Best for:** Easy deployment, good free tier, fast startup

**Free Tier:**
- ✅ $5 credit/month (usually enough for small apps)
- ✅ No spin-down issues
- ✅ Automatic HTTPS
- ✅ Great developer experience

**Setup Steps:**

1. **Create Account:**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Service:**
   - Railway auto-detects Node.js
   - Set **Root Directory** to `backend`
   - Railway will auto-detect `package.json` and run `npm start`

4. **Add Environment Variables:**
   - Go to "Variables" tab
   - Add `GEMINI_API_KEY` = `your_gemini_api_key`
   - Add `NODE_ENV` = `production`

5. **Deploy:**
   - Railway automatically deploys on every push
   - Get your URL from the service dashboard

**Pros:**
- Very fast deployment
- No cold starts
- Clean dashboard
- Good documentation

---

### ☁️ Option 3: Fly.io

**Best for:** Global edge deployment, good performance

**Free Tier:**
- ✅ 3 shared-cpu VMs
- ✅ 3GB persistent volume storage
- ✅ 160GB outbound data transfer
- ✅ Global edge network

**Setup Steps:**

1. **Install Fly CLI:**
   ```bash
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Create App:**
   ```bash
   cd backend
   fly launch
   ```
   - Follow prompts
   - Don't deploy yet when asked

4. **Configure `fly.toml`:**
   Create `backend/fly.toml`:
   ```toml
   app = "your-app-name"
   primary_region = "iad"

   [build]

   [http_service]
     internal_port = 3001
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0

   [[vm]]
     cpu_kind = "shared"
     cpus = 1
     memory_mb = 256
   ```

5. **Set Secrets:**
   ```bash
   fly secrets set GEMINI_API_KEY=your_api_key
   ```

6. **Deploy:**
   ```bash
   fly deploy
   ```

---

### 🔷 Option 4: Render (Alternative Setup without YAML)

**Manual Configuration (if not using render.yaml):**

1. Follow same steps as Option 1
2. Instead of using the YAML file, manually configure:
   - Build: `npm install`
   - Start: `npm start`
   - Port: Auto-detected (uses `PORT` env var)

---

### 🐘 Option 5: Render with PostgreSQL (For Future Database Needs)

If you need a database later:

1. Create PostgreSQL database on Render
2. Add connection string as environment variable
3. Update server.js to connect to database

**Free Tier:** 90-day free trial, then $7/month

---

## Frontend Deployment Options

### ⚡ Option 1: Vercel (Recommended)

**Best for:** React/Vite apps, automatic deployments, edge network

**Free Tier:**
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Preview deployments for PRs
- ✅ 100GB bandwidth/month

**Setup Steps:**

1. **Create Account:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project:**
   - Click "Add New" → "Project"
   - Import your GitHub repository

3. **Configure:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. **Environment Variables:**
   - `VITE_API_URL` = `https://your-backend.onrender.com`

5. **Deploy:**
   - Click "Deploy"
   - Done! 🎉

**Auto-Deploy:** Vercel automatically deploys on every push to main branch

---

### 🌐 Option 2: Netlify

**Best for:** Alternative to Vercel, similar features

**Free Tier:**
- ✅ 100GB bandwidth
- ✅ 300 build minutes/month
- ✅ Automatic HTTPS

**Setup Steps:**

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. "Add new site" → "Import an existing project"
4. Configure:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variable: `VITE_API_URL`
6. Deploy!

---

## Quick Comparison

| Platform | Free Tier | Cold Starts | Ease of Setup | Best For |
|----------|-----------|-------------|---------------|----------|
| **Render** | ✅ Yes | ⚠️ 15min spin-down | ⭐⭐⭐⭐⭐ | Beginners |
| **Railway** | ✅ $5 credit | ❌ No | ⭐⭐⭐⭐⭐ | Fast deployment |
| **Fly.io** | ✅ Yes | ⚠️ Minimal | ⭐⭐⭐ | Global edge |
| **Vercel** | ✅ Yes | ❌ No | ⭐⭐⭐⭐⭐ | Frontend |

---

## Recommended Deployment Strategy

### For Beginners:
```
Backend: Render (free tier, simple setup)
Frontend: Vercel (automatic, zero config)
```

### For Production:
```
Backend: Railway (no cold starts, $5 credit)
Frontend: Vercel (best performance, edge network)
```

---

## Environment Variables Checklist

### Backend (.env or Platform Settings):
- ✅ `GEMINI_API_KEY` - Your Gemini API key
- ✅ `PORT` - Auto-set by platform (usually)
- ✅ `NODE_ENV` - Set to `production`

### Frontend (Platform Settings):
- ✅ `VITE_API_URL` - Your backend URL (e.g., `https://backend.onrender.com`)

---

## Testing Your Deployment

### Backend Health Check:
```bash
curl https://your-backend.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### Test API Endpoint:
```bash
curl -X POST https://your-backend.onrender.com/api/refine \
  -H "Content-Type: application/json" \
  -d '{"idea": "A simple todo app"}'
```

---

## Troubleshooting

### Backend Issues:

**Problem:** "GEMINI_API_KEY is missing"
- ✅ Check environment variables are set correctly
- ✅ Restart the service after adding env vars

**Problem:** "Port already in use"
- ✅ Remove hardcoded port, use `process.env.PORT`
- ✅ Already fixed in server.js (uses `process.env.PORT || 3001`)

**Problem:** Cold start delays (Render)
- ✅ This is normal for free tier
- ✅ Upgrade to paid plan for no spin-down
- ✅ Or use Railway (no cold starts)

**Problem:** Deployment fails
- ✅ Check build logs
- ✅ Ensure `package.json` has correct scripts
- ✅ Verify Node.js version compatibility

### Frontend Issues:

**Problem:** "Cannot connect to API"
- ✅ Check `VITE_API_URL` is correct
- ✅ Ensure backend is deployed and accessible
- ✅ Check CORS is enabled on backend (already done)

**Problem:** Environment variables not working
- ✅ Vite requires `VITE_` prefix for env vars
- ✅ Rebuild after changing env vars

---

## Next Steps After Deployment

1. ✅ Test backend health endpoint
2. ✅ Test API with a sample idea
3. ✅ Deploy frontend
4. ✅ Connect frontend to backend URL
5. ✅ Test full flow end-to-end
6. ✅ Update SUBMISSION.md with live URLs

---

## Cost Estimate (Free Tier)

**Backend (Render Free):**
- $0/month (with 15min spin-down)

**Backend (Railway):**
- $0/month (within $5 credit, usually enough for small apps)

**Frontend (Vercel Free):**
- $0/month (generous free tier)

**Gemini API:**
- Free tier available (Google AI Studio)
- Pay-per-use beyond free tier

**Total: ~$0/month for free tiers + Gemini usage**

---

## Security Notes

✅ Never commit `.env` files (already in .gitignore)
✅ Use platform environment variables for secrets
✅ Keep API keys secure
✅ Enable HTTPS (automatic on all recommended platforms)
✅ Consider rate limiting for production (add later if needed)

---

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [Fly.io Documentation](https://fly.io/docs)
