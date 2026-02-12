# 🚀 Complete Vercel Deployment Guide

This guide will walk you through deploying your Expense Categorizer app to Vercel (frontend) and Railway (backend) step-by-step.

## Why Vercel + Railway?

- **Vercel** - Perfect for React frontend (fast, free, automatic deployments)
- **Railway** - Better for Python backend (easier Python support than Vercel)
- **Both Free Tiers** - No credit card needed to start!

---

## Part 1: Setup (One-Time)

### 1. Create Accounts

**Vercel** (for frontend):
1. Go to [vercel.com/signup](https://vercel.com/signup)
2. Sign up with GitHub (recommended)
3. Authorize Vercel to access your GitHub

**Railway** (for backend):
1. Go to [railway.app](https://railway.app)
2. Click "Login with GitHub"
3. Authorize Railway

**GitHub** (if you don't have it):
1. Go to [github.com/signup](https://github.com/signup)
2. Create your account
3. Verify your email

### 2. Install Git

**Mac:**
```bash
# Install Homebrew first (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Git
brew install git
```

**Windows:**
1. Download from [git-scm.com](https://git-scm.com/download/win)
2. Run installer (use default settings)

**Verify Installation:**
```bash
git --version
# Should show: git version 2.x.x
```

---

## Part 2: Push Code to GitHub

### 1. Create a New Repository

1. Go to [github.com/new](https://github.com/new)
2. **Repository name:** `expense-categorizer`
3. **Description:** "Smart expense categorization web app"
4. Keep it **Public** (or Private if preferred)
5. **Don't** check "Add README" (we already have one)
6. Click **"Create repository"**

### 2. Configure Git (First Time Only)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. Push Your Code

```bash
# Navigate to your project
cd expense-categorizer

# Initialize Git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Expense Categorizer app"

# Set main branch
git branch -M main

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/expense-categorizer.git

# Push to GitHub
git push -u origin main
```

**If it asks for credentials:**
- Use your GitHub username
- For password, use a [Personal Access Token](https://github.com/settings/tokens)

---

## Part 3: Deploy Backend to Railway

### 1. Create New Project

1. Go to [railway.app/new](https://railway.app/new)
2. Click **"Deploy from GitHub repo"**
3. Select **`expense-categorizer`**
4. Click **"Deploy Now"**

### 2. Configure Backend

1. **Wait for initial deployment** (may fail, that's OK!)

2. **Go to Settings Tab**
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Click "Generate Domain"**
   - Railway will create a URL like: `your-app-production.up.railway.app`
   - **Copy this URL!** You'll need it for the frontend

4. **Redeploy**
   - Click "Deploy" tab
   - Click "Deploy" button
   - Wait for green checkmark ✅

### 3. Test Backend

Visit: `https://your-app-production.up.railway.app/`

You should see:
```json
{"message": "Expense Categorizer API", "version": "1.0"}
```

✅ Backend is live!

---

## Part 4: Deploy Frontend to Vercel

### 1. Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Find **`expense-categorizer`**
4. Click **"Import"**

### 2. Configure Build Settings

**Framework Preset:** Select **"Vite"**

**Root Directory:**
- Click **"Edit"**
- Type: `frontend`
- Click **"Continue"**

**Build & Development Settings:**
- Build Command: `npm run build` (should be auto-filled)
- Output Directory: `dist` (should be auto-filled)
- Install Command: `npm install` (should be auto-filled)

### 3. Add Environment Variable

Before clicking deploy:

1. Click **"Environment Variables"** dropdown
2. **Key:** `VITE_API_URL`
3. **Value:** `https://your-app-production.up.railway.app` (your Railway URL)
4. Click **"Add"**

### 4. Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. You'll see confetti 🎉 when done!

### 5. Get Your URL

Vercel will give you a URL like:
- `expense-categorizer.vercel.app`
- or `expense-categorizer-yourusername.vercel.app`

---

## Part 5: Test the App!

1. **Visit your Vercel URL**
2. **Upload a test PDF** (use one of your Chase statements)
3. **Watch it categorize!** 🎉

---

## 🔄 Making Updates

After you've deployed, here's how to push updates:

```bash
# Make your changes to the code

# Commit changes
git add .
git commit -m "Description of changes"

# Push to GitHub
git push

# That's it! Vercel and Railway auto-deploy!
```

Both Vercel and Railway will automatically redeploy when you push to GitHub. Magic! ✨

---

## 🐛 Troubleshooting

### Backend shows "Application Error"

**Check Railway Logs:**
1. Go to Railway dashboard
2. Click your project
3. Click "Deployments" tab
4. Click latest deployment
5. Look for errors in red

**Common fixes:**
- Make sure `requirements.txt` is in `backend/` folder
- Check that Start Command is correct
- Verify Python version is 3.9+

### Frontend shows blank page

**Check Browser Console:**
1. Right-click page → "Inspect"
2. Go to "Console" tab
3. Look for errors

**Common fixes:**
- Verify `VITE_API_URL` in Vercel settings
- Make sure Railway backend is running
- Check for CORS errors (should be handled, but check)

### "Connection refused" error

- Backend might not be running
- Check Railway URL is correct
- Make sure Railway project is not sleeping (free tier sleeps after inactivity)

### Git push asks for password repeatedly

Create a Personal Access Token:
1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token
4. Check "repo" scope
5. Use this token instead of password

---

## 💰 Costs

**Free Tier Limits:**

**Vercel:**
- 100 GB bandwidth/month
- Unlimited projects
- 6,000 build minutes/month
- ✅ More than enough for personal use!

**Railway:**
- $5 free credit per month
- Usually uses $0.10-0.50/month for this app
- ✅ Effectively free!

---

## 🎓 Next Steps

Once deployed, you can:

1. **Share the link** with others (if you want!)
2. **Add a custom domain** (both Vercel and Railway support this)
3. **Enable analytics** in Vercel dashboard
4. **Monitor usage** in Railway dashboard
5. **Set up automatic database backups** (optional)

---

## 🆘 Need Help?

**Common Resources:**
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Vite Docs](https://vitejs.dev)
- [FastAPI Docs](https://fastapi.tiangolo.com)

**Something not working?**
- Check Railway logs
- Check Vercel logs (Dashboard → Project → Deployments → Click deployment)
- Check browser console (F12)

---

## 🎉 Congratulations!

You've deployed a full-stack web app!

Every time you push to GitHub, your app automatically updates. No manual deployment needed!

Now go categorize those expenses! 💪
