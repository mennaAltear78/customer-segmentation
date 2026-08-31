import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, PlusCircle, AlertCircle, Clock, CheckCircle, ShieldAlert, ArrowRight, Sparkles } from 'lucide-react';
import { addTransaction, uploadTransactionsCSV, type AddTransactionResponse, type CSVUploadResponse } from '../api/transactionsApi';
import { SegmentBadge } from '../components/SegmentBadge';
import { RFMCard } from '../components/RFMCard';
import { Header } from '../components/Header';

interface AddDataProps {
  onMenuToggle: () => void;
}

export const AddData: React.FC<AddDataProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'single' | 'csv'>('single');

  // Tab 1: Single Transaction form fields
  const [customerId, setCustomerId] = useState<string>('');
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [quantity, setQuantity] = useState<string>('1');
  const [unitPrice, setUnitPrice] = useState<string>('9.99');
  const [stockCode, setStockCode] = useState<string>('');

  // Single transaction submission states
  const [submittingSingle, setSubmittingSingle] = useState(false);
  const [singleErrors, setSingleErrors] = useState<Record<string, string>>({});
  const [singleApiError, setSingleApiError] = useState<string | null>(null);
  const [singleResult, setSingleResult] = useState<AddTransactionResponse | null>(null);

  // Tab 2: CSV Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingCSV, setUploadingCSV] = useState(false);
  const [csvApiError, setCsvApiError] = useState<string | null>(null);
  const [csvResult, setCsvResult] = useState<CSVUploadResponse | null>(null);

  // Single Form validation
  const validateSingleForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!customerId.trim()) {
      errors.customerId = 'Customer ID is required.';
    } else {
      const idNum = Number(customerId);
      if (isNaN(idNum) || idNum <= 0 || !Number.isInteger(idNum)) {
        errors.customerId = 'Customer ID must be a positive integer.';
      }
    }

    if (!invoiceNo.trim()) {
      errors.invoiceNo = 'Invoice number is required.';
    }

    if (!invoiceDate) {
      errors.invoiceDate = 'Invoice date is required.';
    }

    const qtyNum = Number(quantity);
    if (isNaN(qtyNum) || !Number.isInteger(qtyNum) || qtyNum === 0) {
      errors.quantity = 'Quantity must be a non-zero integer.';
    }

    const priceNum = Number(unitPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.unitPrice = 'Unit price must be a positive number.';
    }

    if (!stockCode.trim()) {
      errors.stockCode = 'Stock code is required.';
    }

    setSingleErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Single Form Submit handler
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSingleForm()) return;

    setSubmittingSingle(true);
    setSingleApiError(null);

    const payload = {
      customer_id: parseInt(customerId.trim(), 10),
      invoice_no: invoiceNo.trim(),
      invoice_date: invoiceDate,
      quantity: parseInt(quantity, 10),
      unit_price: parseFloat(unitPrice),
      stock_code: stockCode.trim(),
    };

    try {
      const resultData = await addTransaction(payload);
      setSingleResult(resultData);
    } catch (err: any) {
      console.error(err);
      const detail = err?.response?.data?.detail;
      setSingleApiError(
        typeof detail === 'string'
          ? `Failed to add transaction: ${detail}`
          : 'Unable to add transaction. Please verify API server status.'
      );
    } finally {
      setSubmittingSingle(false);
    }
  };

  // CSV Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setCsvApiError(null);
        setCsvResult(null);
      } else {
        setCsvApiError("Only CSV files are accepted.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setCsvApiError(null);
        setCsvResult(null);
      } else {
        setCsvApiError("Only CSV files are accepted.");
      }
    }
  };

  // CSV Submit handler
  const handleCSVUpload = async () => {
    if (!selectedFile) return;

    setUploadingCSV(true);
    setCsvApiError(null);

    try {
      const res = await uploadTransactionsCSV(selectedFile);
      setCsvResult(res);
      setSelectedFile(null);
    } catch (err: any) {
      console.error(err);
      const detail = err?.response?.data?.detail;
      setCsvApiError(
        typeof detail === 'string'
          ? `Upload failed: ${detail}`
          : 'Unable to upload CSV. Ensure server is active and file matches required schema.'
      );
    } finally {
      setUploadingCSV(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Add Data"
        subtitle="Intake transaction details manually or upload in bulk via CSV to recalculate RFM segments and churn predictions."
        onMenuToggle={onMenuToggle}
      />
      
      <div className="p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto animate-fadeIn text-left">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--border-color)]">
          <button
            onClick={() => { setActiveTab('single'); setSingleResult(null); setCsvResult(null); }}
            className={`px-5 py-2.5 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'single'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <PlusCircle size={16} />
            Add Transaction
          </button>
          <button
            onClick={() => { setActiveTab('csv'); setSingleResult(null); setCsvResult(null); }}
            className={`px-5 py-2.5 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'csv'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Upload size={16} />
            Upload CSV File
          </button>
        </div>

        {/* Tab content area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* TAB 1: ADD TRANSACTION FORM */}
          {activeTab === 'single' && (
            <>
              <div className="lg:col-span-5 p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xs space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">Transaction Details</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Input transaction fields to save and update customer state.</p>
                </div>

                <form onSubmit={handleSingleSubmit} className="space-y-4">
                  {/* Customer ID */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                      Customer ID
                    </label>
                    <input
                      type="text"
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      placeholder="e.g. 17850"
                      disabled={submittingSingle}
                      className={`block w-full px-3 py-2 border rounded-lg bg-[var(--bg-primary)]/50 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all ${
                        singleErrors.customerId ? 'border-red-500 ring-1 ring-red-500' : 'border-[var(--border-color)]'
                      }`}
                    />
                    {singleErrors.customerId && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {singleErrors.customerId}
                      </p>
                    )}
                  </div>

                  {/* Invoice Number & Stock Code */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                        Invoice No
                      </label>
                      <input
                        type="text"
                        value={invoiceNo}
                        onChange={(e) => setInvoiceNo(e.target.value)}
                        placeholder="e.g. 536365"
                        disabled={submittingSingle}
                        className={`block w-full px-3 py-2 border rounded-lg bg-[var(--bg-primary)]/50 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all ${
                          singleErrors.invoiceNo ? 'border-red-500 ring-1 ring-red-500' : 'border-[var(--border-color)]'
                        }`}
                      />
                      {singleErrors.invoiceNo && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {singleErrors.invoiceNo}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                        Stock Code
                      </label>
                      <input
                        type="text"
                        value={stockCode}
                        onChange={(e) => setStockCode(e.target.value)}
                        placeholder="e.g. 85123A"
                        disabled={submittingSingle}
                        className={`block w-full px-3 py-2 border rounded-lg bg-[var(--bg-primary)]/50 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all ${
                          singleErrors.stockCode ? 'border-red-500 ring-1 ring-red-500' : 'border-[var(--border-color)]'
                        }`}
                      />
                      {singleErrors.stockCode && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {singleErrors.stockCode}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Invoice Date */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      disabled={submittingSingle}
                      className={`block w-full px-3 py-2 border rounded-lg bg-[var(--bg-primary)]/50 text-sm text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all ${
                        singleErrors.invoiceDate ? 'border-red-500 ring-1 ring-red-500' : 'border-[var(--border-color)]'
                      }`}
                    />
                    {singleErrors.invoiceDate && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {singleErrors.invoiceDate}
                      </p>
                    )}
                  </div>

                  {/* Split Quantity and Unit Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="6"
                        disabled={submittingSingle}
                        className={`block w-full px-3 py-2 border rounded-lg bg-[var(--bg-primary)]/50 text-sm text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all ${
                          singleErrors.quantity ? 'border-red-500 ring-1 ring-red-500' : 'border-[var(--border-color)]'
                        }`}
                      />
                      {singleErrors.quantity && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {singleErrors.quantity}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                        Unit Price (£)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        placeholder="2.55"
                        disabled={submittingSingle}
                        className={`block w-full px-3 py-2 border rounded-lg bg-[var(--bg-primary)]/50 text-sm text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all ${
                          singleErrors.unitPrice ? 'border-red-500 ring-1 ring-red-500' : 'border-[var(--border-color)]'
                        }`}
                      />
                      {singleErrors.unitPrice && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {singleErrors.unitPrice}
                        </p>
                      )}
                    </div>
                  </div>

                  {singleApiError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg text-xs flex gap-2">
                      <ShieldAlert size={16} className="shrink-0" />
                      <span>{singleApiError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingSingle}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-75"
                  >
                    {submittingSingle ? (
                      <>
                        <Clock size={16} className="animate-spin" />
                        Adding Transaction...
                      </>
                    ) : (
                      <>
                        <PlusCircle size={16} />
                        Add Transaction
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* SINGLE RESULT CARD */}
              <div className="lg:col-span-7 space-y-6">
                {singleResult ? (
                  <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xs space-y-6 animate-scaleIn">
                    <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)]">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-emerald-500" size={20} />
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">Transaction Added Successfully</h3>
                      </div>
                      <button
                        onClick={() => navigate(`/customer/${singleResult.customer_id}`)}
                        className="flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-all cursor-pointer"
                      >
                        View Profile
                        <ArrowRight size={14} />
                      </button>
                    </div>

                    {/* Segment card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Segmentation</span>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-base font-bold text-[var(--text-primary)]">
                            {singleResult.segmentation?.segment ?? 'Unknown'}
                          </span>
                          <SegmentBadge segment={singleResult.segmentation?.segment ?? 'Unknown'} />
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Churn Status</span>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">
                            {((singleResult.churn?.churn_probability ?? 0) * 100).toFixed(0)}% — {singleResult.churn?.prediction ?? 'Not Churn'}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${singleResult.churn?.prediction === 'Churn' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                        </div>
                      </div>
                    </div>

                    {/* RFM parameters */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Recalculated RFM Parameters</h4>
                      <RFMCard
                        recency={singleResult.rfm?.recency ?? 0}
                        frequency={singleResult.rfm?.frequency ?? 0}
                        monetary={singleResult.rfm?.monetary ?? 0}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 h-full min-h-[350px] border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] shadow-sm text-center">
                    <div className="p-4 bg-[var(--bg-primary)] rounded-full text-[var(--text-tertiary)] mb-4 animate-pulse">
                      <PlusCircle size={32} />
                    </div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Awaiting Input</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-2 max-w-sm">
                      Enter transaction details and submit. The system will write the record and execute segmentation models automatically.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: UPLOAD CSV FILE */}
          {activeTab === 'csv' && (
            <div className="lg:col-span-12 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xs space-y-5">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">CSV File Upload</h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">Upload transactions ledger file. The columns must include: <strong>customer_id, invoice_no, invoice_date, quantity, unit_price, stock_code</strong>.</p>
                    </div>

                    {/* Drag and Drop Zone */}
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 transition-all ${
                        dragActive ? 'border-[var(--accent)] bg-[var(--accent-light)]/20' : 'border-[var(--border-color)] bg-[var(--bg-primary)]/20'
                      }`}
                    >
                      <input
                        type="file"
                        id="csv-file-input"
                        onChange={handleFileChange}
                        accept=".csv"
                        className="hidden"
                      />
                      
                      <FileSpreadsheet size={36} className="text-[var(--text-tertiary)]" />
                      
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {selectedFile ? selectedFile.name : 'Drag & Drop CSV file here'}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'or browse files from your computer'}
                        </p>
                      </div>

                      {!selectedFile && (
                        <label
                          htmlFor="csv-file-input"
                          className="px-3.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-primary)] transition-all"
                        >
                          Choose File
                        </label>
                      )}
                    </div>

                    {csvApiError && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg text-xs flex gap-2">
                        <ShieldAlert size={16} className="shrink-0" />
                        <span>{csvApiError}</span>
                      </div>
                    )}

                    {selectedFile && (
                      <button
                        onClick={handleCSVUpload}
                        disabled={uploadingCSV}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-75"
                      >
                        {uploadingCSV ? (
                          <>
                            <Clock size={16} className="animate-spin" />
                            Calculating Predictions...
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            Upload and Process CSV
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* CSV UPLOAD SUMMARY RESULT */}
                <div className="lg:col-span-7">
                  {csvResult ? (
                    <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xs space-y-6 animate-scaleIn">
                      <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)]">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-emerald-500" size={20} />
                          <h3 className="text-base font-semibold text-[var(--text-primary)]">CSV Batch Execution Summary</h3>
                        </div>
                        <button
                          onClick={() => navigate('/')}
                          className="flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-all cursor-pointer"
                        >
                          Dashboard
                          <ArrowRight size={14} />
                        </button>
                      </div>

                      {/* Stat summary grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Transactions Processed</span>
                          <p className="text-2xl font-extrabold text-[var(--text-primary)] mt-1.5">
                            {csvResult.transactions_added.toLocaleString()}
                          </p>
                          <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5 mt-1">
                            <Sparkles size={10} /> Saved to Database
                          </span>
                        </div>

                        <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Total Customers Affected</span>
                          <p className="text-2xl font-extrabold text-[var(--text-primary)] mt-1.5">
                            {csvResult.customers_processed.toLocaleString()}
                          </p>
                          <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">RFM models recalculated</span>
                        </div>
                      </div>

                      <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900/30 bg-blue-50/25 dark:bg-blue-950/15 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Database Synchronization</h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-[var(--text-secondary)] block">RFM Records Updated</span>
                            <span className="font-bold text-[var(--text-primary)] mt-0.5 block">{csvResult.segmentation_updated} rows</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-secondary)] block">Churn Records Predicted</span>
                            <span className="font-bold text-[var(--text-primary)] mt-0.5 block">{csvResult.churn_updated} rows</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 h-full min-h-[350px] border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] shadow-sm text-center">
                      <div className="p-4 bg-[var(--bg-primary)] rounded-full text-[var(--text-tertiary)] mb-4 animate-pulse">
                        <Upload size={32} />
                      </div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Awaiting CSV File</h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-2 max-w-sm">
                        Select a CSV file containing transactions and click upload. The server will ingest all records and batch update customer features and predictions.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
