# ⚡ Quick Start Guide

Get the Expense Categorizer running locally in 5 minutes!

## Prerequisites

- Python 3.9+ ([Download here](https://www.python.org/downloads/))
- Node.js 18+ ([Download here](https://nodejs.org/))

Check your versions:
```bash
python --version  # Should be 3.9+
node --version    # Should be 18+
```

---

## 🚀 Setup (First Time)

### 1. Navigate to Project

```bash
cd expense-categorizer
```

### 2. Start Backend

```bash
# Go to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

✅ Backend running at: http://localhost:8000

Keep this terminal open!

### 3. Start Frontend (New Terminal)

```bash
# Go to frontend folder (from project root)
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

✅ Frontend running at: http://localhost:3000

---

## 🎯 Using the App

1. Open http://localhost:3000 in your browser
2. Drag & drop a Chase PDF statement
3. Review auto-categorized transactions
4. Categorize uncertain items
5. Export to CSV!

---

## 🛑 Stop the Servers

**Backend:**
- Press `Ctrl+C` in the backend terminal
- Type `deactivate` to exit virtual environment

**Frontend:**
- Press `Ctrl+C` in the frontend terminal

---

## 🔄 Running Again (After First Setup)

You only need to do this:

**Terminal 1 (Backend):**
```bash
cd expense-categorizer/backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
```

**Terminal 2 (Frontend):**
```bash
cd expense-categorizer/frontend
npm run dev
```

---

## 🐛 Common Issues

**"Python not found"**
- Install Python from python.org
- Make sure "Add to PATH" was checked during install

**"Node not found"**
- Install Node.js from nodejs.org
- Restart your terminal after installing

**"Permission denied" on Mac/Linux**
- Use `python3` instead of `python`
- Use `pip3` instead of `pip`

**Port already in use**
- Backend: Change port in `backend/main.py` (last line)
- Frontend: Vite will auto-use next available port

---

## 📚 Next Steps

- Read [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) to deploy online
- Read [README.md](./README.md) for full documentation
- Start categorizing your expenses!

---

## ✨ Tips

- **Database Location:** `backend/categorization_patterns.db`
  - This stores your learned patterns
  - Back it up to keep your learning!

- **First Statement:** Takes time to categorize
- **Second Statement:** Much faster (it learned!)
- **Third+ Statements:** Mostly automatic! 🎉

Happy categorizing! 💰
