import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, Check, AlertCircle, Download, Sparkles, Calendar } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CATEGORIES = [
  'Groceries - Whole Foods',
  'Groceries - Trader Joe\'s',
  'Groceries - Other',
  'Dining - Restaurants',
  'Dining - Coffee',
  'Home Supplies',
  'Gas',
  'Entertainment',
  'Gifts',
  'Travel',
  'Shopping - Clothes',
  'Shopping - Beauty',
  'Transit',
  'Kip Food',
  'Phone Plan',
  'Subscriptions - Spotify',
  'Subscriptions - Prime',
  'Subscriptions - Rent the runway',
  'School Supplies',
];

function App() {
  const [uploading, setUploading] = useState(false);
  const [monthlyResults, setMonthlyResults] = useState(null);
  const [reviewUpdates, setReviewUpdates] = useState({});
  const [learnedCount, setLearnedCount] = useState(0);

  // Helper to parse date and extract month/year
  const getMonthYear = (dateStr) => {
    const [month, day] = dateStr.split('/').map(Number);
    const year = month >= 9 ? 2025 : 2026; // Assuming Sept-Dec 2025, Jan+ 2026
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  const getMonthName = (monthYearStr) => {
    const [year, month] = monthYearStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const allTransactions = [];

    try {
      // Process each file
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API_URL}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        // Add card type based on filename
        const cardType = file.name.toLowerCase().includes('amazon') ? 'Amazon Card' : 'Chase Sapphire';
        
        response.data.high_confidence.forEach(t => {
          t.card = cardType;
          allTransactions.push(t);
        });
        response.data.needs_review.forEach(t => {
          t.card = cardType;
          allTransactions.push(t);
        });
      }

      // Group transactions by month
      const grouped = {};
      allTransactions.forEach((t) => {
        const monthYear = getMonthYear(t.date);
        if (!grouped[monthYear]) {
          grouped[monthYear] = {
            high_confidence: [],
            needs_review: [],
            summary: {},
          };
        }

        if (t.confidence >= 0.7) {
          grouped[monthYear].high_confidence.push(t);
          if (t.category) {
            grouped[monthYear].summary[t.category] = 
              (grouped[monthYear].summary[t.category] || 0) + t.amount;
          }
        } else {
          grouped[monthYear].needs_review.push(t);
        }
      });

      setMonthlyResults(grouped);

      // Initialize review updates
      const updates = {};
      Object.keys(grouped).forEach(month => {
        updates[month] = {};
        grouped[month].needs_review.forEach((t, i) => {
          updates[month][i] = t.category || '';
        });
      });
      setReviewUpdates(updates);

    } catch (error) {
      console.error('Upload error:', error);
      alert('Error processing files. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  });

  const handleCategoryChange = (month, index, category) => {
    setReviewUpdates(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        [index]: category,
      }
    }));
  };

  const handleSaveAndLearn = async (month) => {
    const updates = monthlyResults[month].needs_review
      .map((t, i) => ({
        description: t.description,
        category: reviewUpdates[month][i],
      }))
      .filter(u => u.category);

    if (updates.length === 0) {
      alert('Please categorize at least one transaction');
      return;
    }

    try {
      await axios.post(`${API_URL}/batch-learn`, updates);
      setLearnedCount(prev => prev + updates.length);

      // Update the monthly results
      const newHighConfidence = [...monthlyResults[month].high_confidence];
      const newNeedsReview = [];
      const newSummary = { ...monthlyResults[month].summary };

      monthlyResults[month].needs_review.forEach((t, i) => {
        if (reviewUpdates[month][i]) {
          newHighConfidence.push({
            ...t,
            category: reviewUpdates[month][i],
            confidence: 1.0,
          });
          newSummary[reviewUpdates[month][i]] = 
            (newSummary[reviewUpdates[month][i]] || 0) + t.amount;
        } else {
          newNeedsReview.push(t);
        }
      });

      setMonthlyResults(prev => ({
        ...prev,
        [month]: {
          high_confidence: newHighConfidence,
          needs_review: newNeedsReview,
          summary: newSummary,
        }
      }));

      setReviewUpdates(prev => ({
        ...prev,
        [month]: {},
      }));
    } catch (error) {
      console.error('Error saving patterns:', error);
      alert('Error saving patterns');
    }
  };

  const exportMonthCSV = (month) => {
    const allTransactions = [
      ...monthlyResults[month].high_confidence,
      ...monthlyResults[month].needs_review.map((t, i) => ({
        ...t,
        category: reviewUpdates[month][i] || 'UNCATEGORIZED',
      })),
    ];

    const csv = [
      ['Date', 'Description', 'Amount', 'Category', 'Card'],
      ...allTransactions.map(t => [
        t.date,
        t.description,
        t.amount.toFixed(2),
        t.category || 'UNCATEGORIZED',
        t.card || '',
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${getMonthName(month).replace(' ', '_')}.csv`;
    a.click();
  };

  const exportMonthSummary = (month) => {
    const csv = [
      ['Category', 'Total'],
      ...Object.entries(monthlyResults[month].summary).map(([cat, amt]) => [cat, amt.toFixed(2)]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary_${getMonthName(month).replace(' ', '_')}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            💳 Expense Categorizer
          </h1>
          <p className="text-gray-600">
            Upload your Chase statements and let AI categorize your expenses
          </p>
        </div>

        {/* Upload Area */}
        {!monthlyResults && (
          <div
            {...getRootProps()}
            className={`border-4 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 bg-white hover:border-indigo-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            {uploading ? (
              <p className="text-lg text-gray-600">Processing your statements...</p>
            ) : isDragActive ? (
              <p className="text-lg text-indigo-600">Drop your PDFs here!</p>
            ) : (
              <>
                <p className="text-lg text-gray-700 mb-2">
                  Drag & drop your Chase statement PDFs here
                </p>
                <p className="text-sm text-gray-500">You can upload multiple files at once!</p>
              </>
            )}
          </div>
        )}

        {/* Success message */}
        {learnedCount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 mb-8">
            <Sparkles className="text-green-600" />
            <p className="text-green-800">
              Learned {learnedCount} new patterns! Next time, these will be auto-categorized.
            </p>
          </div>
        )}

        {/* Monthly Results */}
        {monthlyResults && (
          <div className="space-y-8">
            {Object.keys(monthlyResults)
              .sort()
              .reverse()
              .map((month) => {
                const data = monthlyResults[month];
                const totalAmount = Object.values(data.summary).reduce((a, b) => a + b, 0);

                return (
                  <div key={month} className="bg-white rounded-lg shadow-lg p-6">
                    {/* Month Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <Calendar className="text-indigo-600" size={28} />
                      <h2 className="text-2xl font-bold text-gray-900">
                        {getMonthName(month)}
                      </h2>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Check className="text-green-600" size={20} />
                          <span className="text-sm font-medium text-gray-700">Auto-Categorized</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {data.high_confidence.length}
                        </p>
                      </div>

                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="text-orange-600" size={20} />
                          <span className="text-sm font-medium text-gray-700">Needs Review</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {data.needs_review.length}
                        </p>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Download className="text-blue-600" size={20} />
                          <span className="text-sm font-medium text-gray-700">Total Amount</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          ${totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Needs Review Section */}
                    {data.needs_review.length > 0 && (
                      <div className="mb-6 bg-orange-50 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <AlertCircle className="text-orange-600" />
                          Review & Categorize ({data.needs_review.length} items)
                        </h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {data.needs_review.map((transaction, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-4 p-3 bg-white rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {transaction.description}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {transaction.date} • ${transaction.amount.toFixed(2)} • {transaction.card}
                                </p>
                              </div>
                              <select
                                value={reviewUpdates[month]?.[index] || ''}
                                onChange={(e) => handleCategoryChange(month, index, e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="">Select category...</option>
                                {CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => handleSaveAndLearn(month)}
                          className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2"
                        >
                          <Sparkles size={20} />
                          Save & Learn These Patterns
                        </button>
                      </div>
                    )}

                    {/* Category Summary */}
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Category Summary
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(data.summary)
                          .sort((a, b) => b[1] - a[1])
                          .map(([category, amount]) => (
                            <div
                              key={category}
                              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                            >
                              <span className="font-medium text-gray-700">{category}</span>
                              <span className="font-bold text-gray-900">
                                ${amount.toFixed(2)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Export Buttons */}
                    <div className="flex gap-4">
                      <button
                        onClick={() => exportMonthCSV(month)}
                        className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 flex items-center justify-center gap-2"
                      >
                        <Download size={20} />
                        Export All Transactions
                      </button>
                      <button
                        onClick={() => exportMonthSummary(month)}
                        className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 flex items-center justify-center gap-2"
                      >
                        <Download size={20} />
                        Export Summary
                      </button>
                    </div>
                  </div>
                );
              })}

            {/* Start Over Button */}
            <button
              onClick={() => {
                setMonthlyResults(null);
                setReviewUpdates({});
                setLearnedCount(0);
              }}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              Upload More Statements
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;