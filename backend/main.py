from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import pdfplumber
import re
import json
import sqlite3
from datetime import datetime
from pathlib import Path
import io

app = FastAPI(title="Expense Categorizer API")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DB_PATH = Path("categorization_patterns.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS patterns
                 (merchant TEXT PRIMARY KEY, category TEXT, confidence REAL, last_used TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS categories
                 (name TEXT PRIMARY KEY, parent_category TEXT)''')
    conn.commit()
    conn.close()

init_db()

# Models
class Transaction(BaseModel):
    date: str
    description: str
    amount: float
    category: Optional[str] = None
    confidence: Optional[float] = None
    card_type: Optional[str] = None

class CategoryUpdate(BaseModel):
    description: str
    category: str

class CategorizedResult(BaseModel):
    high_confidence: List[Transaction]
    needs_review: List[Transaction]
    summary: Dict[str, float]

# Default categories based on Chloe's budget
DEFAULT_CATEGORIES = {
    'Groceries - Whole Foods': 'Groceries',
    'Groceries - Trader Joe\'s': 'Groceries',
    'Groceries - Other': 'Groceries',
    'Dining - Restaurants': 'Dining',
    'Dining - Coffee': 'Dining',
    'Home Supplies': None,
    'Gas': None,
    'Entertainment': None,
    'Gifts': None,
    'Travel': None,
    'Shopping - Clothes': 'Shopping',
    'Shopping - Beauty': 'Shopping',
    'Transit': None,
    'Kip Food': None,
    'Phone Plan': None,
    'Subscriptions - Spotify': 'Subscriptions',
    'Subscriptions - Prime': 'Subscriptions',
    'Subscriptions - Rent the runway': 'Subscriptions',
    'School Supplies': None,
}

def extract_transactions_from_pdf(pdf_file) -> List[Transaction]:
    """Extract transactions from Chase PDF statement"""
    transactions = []

    with pdfplumber.open(pdf_file) as pdf:
        full_text = ''
        for page in pdf.pages:
            full_text += page.extract_text() + '\n'

        lines = full_text.split('\n')

        for line in lines:
            # Match Chase format: MM/DD Description $Amount
            date_match = re.match(r'^(\d{2}/\d{2})\s+(.+)', line)
            if date_match:
                date_str = date_match.group(1)
                rest = date_match.group(2).strip()

                # Extract amount
                amount_match = re.search(r'\$?([\d,]+\.\d{2})$', rest)
                if amount_match:
                    amount = float(amount_match.group(1).replace(',', ''))
                    description = rest[:amount_match.start()].strip().rstrip('$').strip()

                    # Skip payments
                    if any(x in description.upper() for x in ['PAYMENT', 'THANK YOU', 'AUTOPAY']):
                        continue

                    transactions.append(Transaction(
                        date=date_str,
                        description=description,
                        amount=amount
                    ))

    return transactions

def get_learned_pattern(merchant: str) -> Optional[tuple]:
    """Get learned categorization pattern from database"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Clean merchant name for matching
    merchant_clean = ' '.join(merchant.upper().split()[:3])  # First 3 words

    c.execute("SELECT category, confidence FROM patterns WHERE merchant LIKE ?", (f'%{merchant_clean}%',))
    result = c.fetchone()
    conn.close()

    return result if result else None

def save_pattern(merchant: str, category: str):
    """Save a categorization pattern to database"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    merchant_clean = ' '.join(merchant.upper().split()[:3])

    c.execute("""INSERT OR REPLACE INTO patterns (merchant, category, confidence, last_used)
                 VALUES (?, ?, ?, ?)""",
              (merchant_clean, category, 1.0, datetime.now().isoformat()))

    conn.commit()
    conn.close()

def categorize_transaction(transaction: Transaction) -> Transaction:
    """Categorize a single transaction using rules and learned patterns"""
    desc = transaction.description.upper()

    # First check learned patterns
    learned = get_learned_pattern(transaction.description)
    if learned:
        transaction.category = learned[0]
        transaction.confidence = learned[1]
        return transaction

    # Rule-based categorization
    category = None
    confidence = 0.9  # High confidence for rule-based

    # Groceries
    if 'WHOLE FOODS' in desc or 'WFM' in desc or 'WHOLEFDS' in desc:
        category = 'Groceries - Whole Foods'
    elif 'TRADER JOE' in desc:
        category = 'Groceries - Trader Joe\'s'
    elif any(x in desc for x in ['PUBLIX', 'WALMART', 'TARGET', 'WINN DIXIE', 'ALDI']):
        category = 'Groceries - Other'
        confidence = 0.6  # Lower confidence - could be other items

    # Dining
    elif any(x in desc for x in ['STARBUCKS', 'DUNKIN', 'COFFEE', 'TATTE', 'MARIAGE']):
        category = 'Dining - Coffee'
    elif any(x in desc for x in ['RESTAURANT', 'CHICK-FIL-A', 'CHIPOTLE', 'PANERA',
                                   'BURGER', 'PIZZA', 'SUSHI', 'GRILL', 'CAFE', 'SWEETGREEN']):
        category = 'Dining - Restaurants'

    # Travel
    elif any(x in desc for x in ['JETBLUE', 'DELTA', 'UNITED', 'AIRLINE', 'HOTEL',
                                   'AIRBNB', 'UBER', 'LYFT']):
        category = 'Travel'

    # Shopping
    elif any(x in desc for x in ['MARSHALLS', 'TJ MAXX', 'TJMAXX', 'NORDSTROM', 'MACY']):
        category = 'Shopping - Clothes'
    elif any(x in desc for x in ['SEPHORA', 'ULTA', 'SALON', 'BEAUTY']):
        category = 'Shopping - Beauty'

    # Home
    elif any(x in desc for x in ['HOME DEPOT', 'LOWES', 'IKEA', 'WAYFAIR']):
        category = 'Home Supplies'

    # Pet
    elif any(x in desc for x in ['CHEWY', 'PETSMART', 'PETCO', 'ROVER']):
        category = 'Kip Food'

    # Transit
    elif any(x in desc for x in ['MBTA', 'TOLL', 'PARKING', 'METRO', 'UBER', 'LYFT']):
        category = 'Transit'

    # Gas
    elif any(x in desc for x in ['SHELL', 'BP#', 'EXXON', 'CHEVRON', 'MOBIL', ' GAS ']):
        category = 'Gas'

    # Entertainment
    elif any(x in desc for x in ['MOVIE', 'CINEMA', 'SPOTIFY', 'NETFLIX', 'MUSEUM']):
        category = 'Entertainment'

    # Subscriptions
    elif 'AMAZON PRIME' in desc:
        category = 'Subscriptions - Prime'
    elif 'RENT THE RUNWAY' in desc:
        category = 'Subscriptions - Rent the runway'

    # Phone
    elif any(x in desc for x in ['VERIZON', 'AT&T', 'T-MOBILE']):
        category = 'Phone Plan'

    # Amazon - always needs review
    elif 'AMAZON' in desc:
        confidence = 0.3

    transaction.category = category
    transaction.confidence = confidence if category else 0.0

    return transaction

@app.get("/")
def read_root():
    return {"message": "Expense Categorizer API", "version": "1.0"}

@app.get("/categories")
def get_categories():
    """Get list of available categories"""
    return {"categories": list(DEFAULT_CATEGORIES.keys())}

@app.post("/upload", response_model=CategorizedResult)
async def upload_statement(file: UploadFile = File(...)):
    """Upload and process a PDF statement"""

    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        # Read PDF
        pdf_content = await file.read()
        pdf_file = io.BytesIO(pdf_content)

        # Extract transactions
        transactions = extract_transactions_from_pdf(pdf_file)

        # Categorize each transaction
        high_confidence = []
        needs_review = []

        for t in transactions:
            categorized = categorize_transaction(t)

            if categorized.confidence >= 0.7:
                high_confidence.append(categorized)
            else:
                needs_review.append(categorized)

        # Calculate summary
        summary = {}
        for t in high_confidence:
            if t.category:
                summary[t.category] = summary.get(t.category, 0) + t.amount

        return CategorizedResult(
            high_confidence=high_confidence,
            needs_review=needs_review,
            summary=summary
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/learn")
def learn_categorization(update: CategoryUpdate):
    """Learn from user's categorization choice"""
    save_pattern(update.description, update.category)
    return {"message": "Pattern learned successfully"}

@app.post("/batch-learn")
def batch_learn(updates: List[CategoryUpdate]):
    """Learn from multiple categorization choices"""
    for update in updates:
        save_pattern(update.description, update.category)
    return {"message": f"Learned {len(updates)} patterns"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
