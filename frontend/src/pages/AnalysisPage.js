import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Upload, FileUp, Loader2, History } from "lucide-react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "sonner";
import Dashboard from "@/components/Dashboard";
import InsightsSection from "@/components/InsightsSection";
import ExportSection from "@/components/ExportSection";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AnalysisPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setUploading(true);
    setAnalyzing(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/analyze-csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setAnalysisResult(response.data);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Error analyzing CSV:', error);
      toast.error(error.response?.data?.detail || 'Error analyzing file. Please ensure it has required columns.');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const handleSampleDataset = async () => {
    setAnalyzing(true);
    try {
      const response = await axios.post(`${API}/analyze-sample`);
      setAnalysisResult(response.data);
      toast.success('Sample dataset analyzed!');
    } catch (error) {
      console.error('Error analyzing sample:', error);
      toast.error('Error analyzing sample dataset');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('demo') === 'true') {
      handleSampleDataset();
    }
  }, [searchParams]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] pb-12">
      {/* Header */}
      <header className="bg-[#0A0F1C]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 px-6 md:px-12 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-300 hover:text-[#00F5FF] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Home</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            FairCheck <span className="text-[#00F5FF]">AI</span>
          </h1>
          <button
            data-testid="history-link-btn"
            onClick={() => navigate('/history')}
            className="flex items-center gap-2 text-slate-300 hover:text-[#7B61FF] transition-colors"
          >
            <History className="w-5 h-5" />
            <span className="font-semibold hidden sm:inline">History</span>
          </button>
        </div>
      </header>

      <motion.div
        className="max-w-7xl mx-auto px-6 md:px-12 mt-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Upload Section */}
        {!analysisResult && (
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white text-center mb-8">
              Upload Your Dataset
            </h2>
            
            <div className="max-w-3xl mx-auto">
              <div
                {...getRootProps()}
                data-testid="upload-dropzone"
                className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group ${
                  isDragActive
                    ? 'border-[#00F5FF] bg-[#00F5FF]/5'
                    : 'border-[#7B61FF]/50 bg-[#7B61FF]/5 hover:border-[#00F5FF] hover:bg-[#00F5FF]/5'
                }`}
              >
                <input {...getInputProps()} />
                
                <motion.div
                  animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                  className="text-[#7B61FF] group-hover:text-[#00F5FF] transition-colors mb-4"
                >
                  {uploading ? (
                    <Loader2 className="w-16 h-16 animate-spin" />
                  ) : (
                    <Upload className="w-16 h-16" />
                  )}
                </motion.div>

                <p className="text-xl font-semibold text-white mb-2">
                  {uploading ? 'Uploading...' : isDragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file'}
                </p>
                <p className="text-sm tracking-wide text-slate-400 mb-6">
                  or click to browse
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <FileUp className="w-4 h-4" />
                  <span>Required columns: Hired (0 or 1), Optional: Gender, Income</span>
                </div>
              </div>

              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-sm tracking-wide text-slate-400">OR</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              <div className="text-center">
                <button
                  data-testid="use-sample-dataset-btn"
                  onClick={handleSampleDataset}
                  disabled={analyzing}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Use Sample Dataset'
                  )}
                </button>
                <p className="text-sm tracking-wide text-slate-400 mt-3">
                  Try our pre-loaded hiring dataset to see FairCheck AI in action
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {analyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <Loader2 className="w-16 h-16 text-[#00F5FF] animate-spin mb-6" />
            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white/90 mb-2">
              Analyzing Dataset...
            </h3>
            <p className="text-base leading-relaxed text-slate-300">
              Running bias detection algorithms
            </p>
          </motion.div>
        )}

        {/* Results */}
        {analysisResult && !analyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                Analysis Results
              </h2>
              <button
                onClick={() => setAnalysisResult(null)}
                className="btn-secondary text-sm py-2 px-6"
              >
                New Analysis
              </button>
            </div>

            <Dashboard data={analysisResult} />
            <InsightsSection insights={analysisResult.insights} alerts={analysisResult.bias_alerts} />
            <ExportSection data={analysisResult} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AnalysisPage;
