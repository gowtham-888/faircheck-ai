import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, TrendingUp, ChevronRight, Trash2, BarChart3 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/analysis-history`);
      setHistory(res.data);
    } catch (err) {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#00F5FF';
    if (score >= 50) return '#7B61FF';
    return '#FF4D6D';
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleSelect = (item) => {
    if (!compareMode) {
      navigate(`/analysis?id=${item.id}`);
      return;
    }
    setSelected(prev => {
      if (prev.find(s => s.id === item.id)) return prev.filter(s => s.id !== item.id);
      if (prev.length >= 2) return [prev[1], item];
      return [...prev, item];
    });
  };

  const handleCompare = () => {
    if (selected.length === 2) {
      navigate(`/compare?a=${selected[0].id}&b=${selected[1].id}`);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <div className="min-h-screen bg-[#0A0F1C] pb-12">
      <header className="bg-[#0A0F1C]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 px-6 md:px-12 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-300 hover:text-[#00F5FF] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Home</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Analysis <span className="text-[#00F5FF]">History</span>
          </h1>
          <div className="flex gap-3">
            <button
              data-testid="compare-toggle-btn"
              onClick={() => { setCompareMode(!compareMode); setSelected([]); }}
              className={`text-sm px-4 py-2 rounded-full font-semibold transition-all duration-300 ${
                compareMode ? 'bg-[#7B61FF] text-white' : 'border border-[#7B61FF] text-[#7B61FF] hover:bg-[#7B61FF]/10'
              }`}
            >
              {compareMode ? 'Cancel Compare' : 'Compare Mode'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12">
        {compareMode && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 mb-6 flex items-center justify-between">
            <p className="text-slate-300 text-sm">
              Select <span className="text-[#00F5FF] font-semibold">2 analyses</span> to compare
              {selected.length > 0 && ` (${selected.length}/2 selected)`}
            </p>
            <button
              data-testid="compare-btn"
              onClick={handleCompare}
              disabled={selected.length !== 2}
              className={`btn-primary text-sm py-2 px-6 ${selected.length !== 2 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              Compare Now
            </button>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-12 h-12 border-2 border-[#00F5FF] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : history.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white/80 mb-2">No analyses yet</h3>
            <p className="text-slate-400 mb-6">Run your first bias analysis to see it here</p>
            <button onClick={() => navigate('/analysis')} className="btn-primary py-3 px-8">Start Analysis</button>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
            {history.map((item) => {
              const isSelected = selected.find(s => s.id === item.id);
              return (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  onClick={() => handleSelect(item)}
                  data-testid={`history-item-${item.id}`}
                  className={`glass-card p-5 cursor-pointer hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-6 ${
                    isSelected ? 'border-[#00F5FF]/60 neon-glow-cyan' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${getScoreColor(item.fairness_score)}15` }}>
                    <span className="text-2xl font-black" style={{ color: getScoreColor(item.fairness_score) }}>{item.fairness_score}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-400">{formatDate(item.timestamp)}</span>
                    </div>
                    <p className="text-white font-semibold">Bias Analysis Report</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {item.bias_alerts?.length > 0 ? (
                        item.bias_alerts.slice(0, 2).map((a, i) => (
                          <span key={i} className="text-xs bg-[#FF4D6D]/15 text-[#FF4D6D] px-2 py-1 rounded-full">{a.split(':')[0]}</span>
                        ))
                      ) : (
                        <span className="text-xs bg-[#00F5FF]/15 text-[#00F5FF] px-2 py-1 rounded-full">No Bias Detected</span>
                      )}
                    </div>
                  </div>
                  {!compareMode && <ChevronRight className="w-5 h-5 text-slate-500" />}
                  {compareMode && (
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'border-[#00F5FF] bg-[#00F5FF]' : 'border-slate-600'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-[#0A0F1C] rounded-full"></div>}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
