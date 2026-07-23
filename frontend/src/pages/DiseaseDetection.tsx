import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { Upload, Camera, FileText, CheckCircle, AlertOctagon, Info, RefreshCw } from 'lucide-react';

const CropsList = ['Rice', 'Cotton', 'Tomato', 'Wheat'];

const DiseaseDetection: React.FC = () => {
  const { t } = useLanguage();

  const [cropType, setCropType] = useState('Rice');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (PNG, JPG, or JPEG).');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setReport(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setError('');
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please drop a valid leaf image.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setReport(null);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please upload or snap a leaf photo first.');
      return;
    }

    setLoading(true);
    setError('');
    setProgress(15);
    setReport(null);

    // Simulate progress animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 300);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('cropType', cropType);

      const response = await axios.post('/api/diseases/detect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        if (response.data.success) {
          setReport(response.data.data);
        } else {
          setError('Foliage analysis failed.');
        }
        setLoading(false);
      }, 400);

    } catch (err: any) {
      clearInterval(interval);
      setError(err.response?.data?.message || 'Server error uploading crop leaf photo.');
      setLoading(false);
    }
  };

  // Generate downloadable PDF report using jsPDF
  const generatePDFReport = () => {
    if (!report) return;

    const doc = new jsPDF();
    
    // Title & Header branding
    doc.setFillColor(22, 163, 74); // Emerald color
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Smart Farmer Assistance System', 15, 18);
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'normal');
    doc.text('Crop Disease Diagnostic Report', 15, 26);

    doc.setTextColor(33, 41, 54);
    
    // Details Grid
    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.text('Diagnosis Summary', 15, 50);
    
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Crop Category: ${report.cropType}`, 15, 60);
    doc.text(`Identified Disease: ${report.diseaseName}`, 15, 67);
    doc.text(`Confidence Rating: ${report.confidence}%`, 15, 74);
    doc.text(`Date of Scan: ${new Date(report.createdAt).toLocaleString()}`, 15, 81);

    // Symptoms Section
    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.text('Symptoms Identified', 15, 95);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'normal');
    let yPos = 103;
    report.symptoms.forEach((sym: string) => {
      doc.text(`- ${sym}`, 15, yPos, { maxWidth: 180 });
      yPos += 8;
    });

    // Causes Section
    yPos += 4;
    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.text('Primary Causes', 15, yPos);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'normal');
    yPos += 8;
    report.causes.forEach((cause: string) => {
      doc.text(`- ${cause}`, 15, yPos, { maxWidth: 180 });
      yPos += 8;
    });

    // Treatment Section
    yPos += 4;
    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.text('Recommended Actions & Remedies', 15, yPos);
    
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text('Organic Remedies:', 15, yPos + 8);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'normal');
    yPos += 14;
    report.treatment.organic.forEach((org: string) => {
      doc.text(`• ${org}`, 15, yPos, { maxWidth: 180 });
      yPos += 8;
    });

    yPos += 2;
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text('Chemical Pesticides:', 15, yPos);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'normal');
    yPos += 6;
    report.treatment.chemical.forEach((chem: string) => {
      doc.text(`• ${chem}`, 15, yPos, { maxWidth: 180 });
      yPos += 8;
    });

    // Footer copyright
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Report compiled by Smart Farmer AI diagnostic engine. Visit portal for live help desk lines.', 15, 280);

    doc.save(`Disease-Report-${report.cropType}.pdf`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <span>🛡️</span> {t('diseaseScanTitle')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload leaf images to diagnose fungal, bacterial, or viral crop diseases instantly.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Left Side: Upload Panel */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleScan} className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
            <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-850 pb-2">Diagnostic Scan</h3>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Select Crop Type</label>
              <div className="grid grid-cols-4 gap-1.5">
                {CropsList.map((crop) => (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => setCropType(crop)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      cropType === crop
                        ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {crop}
                  </button>
                ))}
              </div>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors cursor-pointer relative"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Leaf upload preview"
                    className="mx-auto h-36 w-full object-cover rounded-xl shadow-sm"
                  />
                  <span className="text-xs font-semibold text-slate-500 block">Click or drag files to replace leaf photo</span>
                </div>
              ) : (
                <div className="space-y-2 py-4 flex flex-col items-center">
                  <Upload className="h-10 w-10 text-slate-400" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('uploadPrompt')}</h4>
                  <p className="text-xs text-slate-400">Supports PNG, JPG, or JPEG up to 5MB</p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="w-full rounded-xl bg-primary-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Camera className="h-4 w-4" />
              {loading ? `Analyzing leaf... ${progress}%` : t('scanAnalyze')}
            </button>
          </form>
        </div>

        {/* Right Side: Diagnostics Output */}
        <div className="lg:col-span-7 space-y-6">
          
          {loading && (
            <div className="glass-panel rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
              <div className="relative flex items-center justify-center h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-850"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
                <span className="text-xs font-bold text-slate-650">{progress}%</span>
              </div>
              <h3 className="text-lg font-bold">Scanning Crop Tissue</h3>
              <p className="text-sm text-slate-500 max-w-xs">AI diagnostic engine is cross-checking cell structures against pathogen records.</p>
            </div>
          )}

          {report && !loading && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
              
              {/* Header result row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">{t('diagnosisResult')}</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{report.diseaseName}</h2>
                  <p className="text-xs text-slate-500">Pathogen detected on {report.cropType} leaves</p>
                </div>
                
                <div className="text-right sm:text-right shrink-0">
                  <span className="text-xs text-slate-400 block mb-0.5">Confidence Rating</span>
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-3.5 py-1 text-sm font-extrabold text-emerald-800 dark:text-emerald-400">
                    {report.confidence}%
                  </span>
                </div>
              </div>

              {/* Symptoms & Causes Grid */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <AlertOctagon className="h-4 w-4 text-amber-500" />
                    {t('symptoms')}
                  </h4>
                  <ul className="text-xs space-y-2 leading-relaxed">
                    {report.symptoms.map((s: string, idx: number) => (
                      <li key={idx} className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/50">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-blue-500" />
                    {t('causes')}
                  </h4>
                  <ul className="text-xs space-y-2 leading-relaxed">
                    {report.causes.map((c: string, idx: number) => (
                      <li key={idx} className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/50">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <hr className="border-slate-150 dark:border-slate-800" />

              {/* Remedy Toggles */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Treatment Plan</h3>
                
                <div className="grid gap-4 sm:grid-cols-3">
                  
                  <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100/50 dark:border-emerald-900/20 space-y-2">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 block">{t('organicRemedy')}</span>
                    <ul className="text-[11px] space-y-1.5 leading-relaxed text-slate-700 dark:text-slate-350">
                      {report.treatment.organic.map((org: string, idx: number) => (
                        <li key={idx}>• {org}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/15 border border-blue-100/50 dark:border-blue-900/20 space-y-2">
                    <span className="text-xs font-bold text-blue-800 dark:text-blue-400 block">{t('chemicalPesticide')}</span>
                    <ul className="text-[11px] space-y-1.5 leading-relaxed text-slate-700 dark:text-slate-350">
                      {report.treatment.chemical.map((chem: string, idx: number) => (
                        <li key={idx}>• {chem}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/15 border border-purple-100/50 dark:border-purple-900/20 space-y-2">
                    <span className="text-xs font-bold text-purple-800 dark:text-purple-400 block">{t('preventionTips')}</span>
                    <ul className="text-[11px] space-y-1.5 leading-relaxed text-slate-700 dark:text-slate-355">
                      {report.treatment.prevention.map((prev: string, idx: number) => (
                        <li key={idx}>• {prev}</li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>

              {/* Action Downloads */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={generatePDFReport}
                  className="flex-1 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary-700 flex items-center justify-center gap-1.5"
                >
                  <FileText className="h-4 w-4" />
                  {t('downloadPdf')}
                </button>
                <button
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null); setReport(null); }}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

            </div>
          )}

          {!report && !loading && (
            <div className="glass-panel rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
              <div className="text-5xl">🛡️</div>
              <h3 className="text-lg font-bold">No disease scan performed yet.</h3>
              <p className="text-sm text-slate-500 max-w-sm">Select crop, upload a leafy photo on the left panel, and tap Scan to execute AI diagnostics.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default DiseaseDetection;
