# 💳 Expense Categorizer

A smart web app that automatically categorizes your Chase credit card expenses using AI pattern recognition. Upload your PDF statements, review uncertain transactions, and export categorized data for your budget spreadsheet.

## ✨ Features

- **📤 PDF Upload** - Drag & drop Chase statement PDFs
- **🤖 Auto-Categorization** - Learns from your choices
- **📊 Smart Review** - Only shows uncertain transactions
- **💾 Pattern Learning** - Remembers merchant categories
- **📥 Export** - Download as CSV for Excel/Google Sheets
- **🎨 Clean UI** - Modern, responsive design

## 🏗️ Tech Stack

**Frontend:**
- React 18
- Vite (build tool)
- Tailwind CSS (styling)
- Axios (API calls)
- React Dropzone (file upload)

**Backend:**
- FastAPI (Python)
- pdfplumber (PDF parsing)
- SQLite (pattern storage)
- Uvicorn (ASGI server)

## 🚀 Deployment to Vercel

### Prerequisites
- [Vercel account](https://vercel.com/signup) (free tier works!)
- [Git](https://git-scm.com/downloads) installed
- [GitHub account](https://github.com/signup)

### Step 1: Push to GitHub

1. **Create a new repository on GitHub**
   - Go to github.com/new
   - Name it: `expense-categorizer`
   - Don't initialize with README

2. **Push your code**
   ```bash
   cd expense-categorizer
   git init
   git add .
   git commit -m "Initial commit: Expense Categorizer"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/expense-categorizer.git
   git push -u origin main
   ```

### Step 2: Deploy Frontend to Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Click "Add New" → "Project"**

3. **Import your GitHub repository**
   - Search for `expense-categorizer`
   - Click "Import"

4. **Configure the project**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. **Add Environment Variable**
   - Click "Environment Variables"
   - Add: `VITE_API_URL` = `https://your-backend-url.vercel.app`
   - (We'll update this after backend is deployed)

6. **Click "Deploy"**

### Step 3: Deploy Backend to Vercel

The backend needs a separate deployment because Vercel handles Python differently.

1. **Create `vercel.json` in the root directory**
   ```json
   {
     "builds": [
       {
         "src": "backend/main.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "backend/main.py"
       }
     ]
   }
   ```

2. **Deploy backend**
   - In Vercel Dashboard, create a new project
   - Select same GitHub repo
   - **Root Directory:** Leave empty (root)
   - Deploy

3. **Update Frontend Environment Variable**
   - Go to your frontend project settings
   - Update `VITE_API_URL` with your backend URL
   - Redeploy frontend

### Alternative: Railway (Better for Python)

Railway is actually better suited for Python backends. Here's how:

1. **Go to [Railway.app](https://railway.app)**
2. **Click "New Project" → "Deploy from GitHub"**
3. **Select your repo → Choose backend directory**
4. **Railway will auto-detect Python and deploy**
5. **Copy the generated URL**
6. **Update Vercel frontend env var with Railway URL**

## 🛠️ Local Development

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Backend runs on: http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:3000

## 📖 How to Use

1. **Upload Statement**
   - Drag & drop your Chase PDF or click to browse
   - Wait for processing (usually 5-10 seconds)

2. **Review Results**
   - ✅ **Auto-Categorized** - High confidence transactions
   - ⚠️ **Needs Review** - Uncertain transactions

3. **Categorize Uncertain Items**
   - Select category from dropdown for each transaction
   - Click "Save & Learn These Patterns"

4. **Export**
   - **All Transactions** - Complete CSV with all data
   - **Summary** - Totals by category for your budget

5. **Learn & Improve**
   - The more you use it, the smarter it gets!
   - Merchants you categorize once will auto-categorize next time

## 🎯 Category List

The app uses your existing budget categories:

- **Groceries** - Whole Foods, Trader Joe's, Other
- **Dining** - Restaurants, Coffee
- **Home Supplies**
- **Gas**
- **Entertainment**
- **Gifts**
- **Travel**
- **Shopping** - Clothes, Beauty
- **Transit**
- **Kip Food** (Pet expenses)
- **Phone Plan**
- **Subscriptions** - Spotify, Prime, Rent the Runway
- **School Supplies**

## 🔒 Privacy & Security

- **No data stored on servers** - Only learned patterns (merchant→category)
- **No personal info collected** - We don't see your full statements
- **Runs locally** - Can be used offline if needed
- **Open source** - Audit the code yourself

## 🤝 Contributing

Want to add features? Here are some ideas:

- [ ] Support for other bank formats (Capital One, Amex, etc.)
- [ ] Monthly spending trends chart
- [ ] Budget vs. actual tracking
- [ ] Receipt photo upload & OCR
- [ ] Multi-currency support
- [ ] Mobile app version

## 📝 License

MIT License - Feel free to use, modify, and distribute!

## 🆘 Troubleshooting

**PDF won't upload**
- Make sure it's a Chase PDF statement
- Check file size (should be under 10MB)
- Try a different browser

**Categorization seems off**
- Review and correct a few transactions
- The app learns from your choices
- After 2-3 statements, accuracy improves significantly

**Backend not connecting**
- Check VITE_API_URL in frontend .env
- Ensure backend is running
- Check browser console for CORS errors

## 💡 Tips for Best Results

1. **Consistent Naming** - Use same category names as your budget
2. **Regular Use** - The more statements you process, the better it gets
3. **Review First Month** - Spend time categorizing properly the first time
4. **Export Regularly** - Don't wait until tax time!

---

Built with ❤️ for better expense tracking
