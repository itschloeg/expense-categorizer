import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, Check, AlertCircle, Download, Sparkles } from 'lucide-react';

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
  const [result, setResult] = useState(null);
  const [reviewUpdates, setReviewUpdates] = useState({});
  const [learnedCount, setLearnedCount] = useState(0);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);

      // Initialize review updates
      const updates = {};
      response.data.needs_review.forEach((t, i) => {
        updates[i] = t.category || '';
      });
      setReviewUpdates(updates);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error processing file. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  const handleCategoryChange = (index, category) => {
    setReviewUpdates({ ...reviewUpdates, [index]: category });
  };

  const handleSaveAndLearn = async () => {
    const updates = result.needs_review
      .map((t, i) => ({
        description: t.description,
        category: reviewUpdates[i],
      }))
      .filter(u => u.category);

    if (updates.length === 0) {
      alert('Please categorize at least one transaction');
      return;
    }

    try {
      await axios.post(`${API_URL}/batch-learn`, updates);
      setLearnedCount(updates.length);

      // Update high confidence list with categorized items
      const newHighConfidence = [...result.high_confidence];
      result.needs_review.forEach((t, i) => {
        if (reviewUpdates[i]) {
          newHighConfidence.push({
            ...t,
            category: reviewUpdates[i],
            confidence: 1.0,
          });
        }
      });

      // Remove categorized items from needs review
      const newNeedsReview = result.needs_review.filter((t, i) => !reviewUpdates[i]);

      setResult({
        ...result,
        high_confidence: newHighConfidence,
        needs_review: newNeedsReview,
      });

      // Recalculate summary
      const newSummary = {};
      newHighConfidence.forEach(t => {
        if (t.category) {
          newSummary[t.category] = (newSummary[t.category] || 0) + t.amount;
        }
      });
      setResult(prev => ({ ...prev, summary: newSummary }));

      setReviewUpdates({});
    } catch (error) {
      console.error('Error saving patterns:', error);
      alert('Error saving patterns');
    }
  };

  const exportToCSV = () => {
    if (!result) return;

    const allTransactions = [
      ...result.high_confidence,
      ...result.needs_review.map((t, i) => ({
        ...t,
        category: reviewUpdates[i] || 'UNCATEGORIZED',
      })),
    ];

    const csv = [
      ['Date', 'Description', 'Amount', 'Category'],
      ...allTransactions.map(t => [
        t.date,
        t.description,
        t.amount.toFixed(2),
        t.category || 'UNCATEGORIZED',
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'categorized_expenses.csv';
    a.click();
  };

  const exportSummary = () => {
    if (!result) return;

    const csv = [
      ['Category', 'Total'],
      ...Object.entries(result.summary).map(([cat, amt]) => [cat, amt.toFixed(2)]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expense_summary.csv';
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
            Upload your Chase statement and let AI categorize your expenses
          </p>
        </div>

        {/* Upload Area */}
        {!result && (
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
              <p className="text-lg text-gray-600">Processing your statement...</p>
            ) : isDragActive ? (
              <p className="text-lg text-indigo-600">Drop your PDF here!</p>
            ) : (
              <>
                <p className="text-lg text-gray-700 mb-2">
                  Drag & drop your Chase statement PDF here
                </p>
                <p className="text-sm text-gray-500">or click to browse</p>
              </>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-8">
            {/* Success message */}
            {learnedCount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <Sparkles className="text-green-600" />
                <p className="text-green-800">
                  Learned {learnedCount} new patterns! Next time, these will be auto-categorized.
                </p>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Check className="text-green-500" />
                  <h3 className="font-semibold text-gray-700">Auto-Categorized</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {result.high_confidence.length}
                </p>
                <p className="text-sm text-gray-500">transactions</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="text-orange-500" />
                  <h3 className="font-semibold text-gray-700">Needs Review</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {result.needs_review.length}
                </p>
                <p className="text-sm text-gray-500">transactions</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Download className="text-blue-500" />
                  <h3 className="font-semibold text-gray-700">Total Amount</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ${Object.values(result.summary).reduce((a, b) => a + b, 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">categorized</p>
              </div>
            </div>

            {/* Needs Review Section */}
            {result.needs_review.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="text-orange-500" />
                  Review & Categorize ({result.needs_review.length} items)
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {result.needs_review.map((transaction, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {transaction.date} • ${transaction.amount.toFixed(2)}
                        </p>
                      </div>
                      <select
                        value={reviewUpdates[index] || ''}
                        onChange={(e) => handleCategoryChange(index, e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  onClick={handleSaveAndLearn}
                  className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles size={20} />
                  Save & Learn These Patterns
                </button>
              </div>
            )}

            {/* Category Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Category Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(result.summary)
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
                onClick={exportToCSV}
                className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Export All Transactions
              </button>
              <button
                onClick={exportSummary}
                className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Export Summary
              </button>
            </div>

            {/* Start Over Button */}
            <button
              onClick={() => {
                setResult(null);
                setReviewUpdates({});
                setLearnedCount(0);
              }}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Upload Another Statement
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
