import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import axios from "axios";
import Dashboard from "@/components/Dashboard";
import InsightsSection from "@/components/InsightsSection";
import ExportSection from "@/components/ExportSection";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SharedReportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get(`${API}/analysis/${id}`);
        setData(res.data);
      } catch (err) {
        setError("Report not found or has expired.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchReport();
  }, [id]);

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#00F5FF] animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-16 h-16 text-[#FF4D6D]" />
        <h2 className="text-2xl font-bold text-white">{error || "Report not found"}</h2>
        <button onClick={() => navigate('/')} className="btn-primary py-3 px-8 mt-4">
          Go to Homepage
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C] pb-12">
      <header className="bg-[#0A0F1C]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 px-6 md:px-12 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-300 hover:text-[#00F5FF] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">FairCheck AI</span>
          </button>
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Shared <span className="text-[#00F5FF]">Report</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">{formatDate(data.timestamp)}</p>
          </div>
          <div className="w-24"></div>
        </div>
      </header>

      <motion.div
        className="max-w-7xl mx-auto px-6 md:px-12 mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Dashboard data={data} />
        <InsightsSection insights={data.insights} alerts={data.bias_alerts} />
        <ExportSection data={data} />
      </motion.div>
    </div>
  );
};

export default SharedReportPage;
