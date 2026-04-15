import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ComparePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idA = searchParams.get('a');
    const idB = searchParams.get('b');
    if (idA && idB) {
      Promise.all([
        axios.get(`${API}/analysis/${idA}`),
        axios.get(`${API}/analysis/${idB}`)
      ]).then(([resA, resB]) => {
        setDataA(resA.data);
        setDataB(resB.data);
      }).catch(() => {
        toast.error("Failed to load comparison data");
      }).finally(() => setLoading(false));
    }
  }, [searchParams]);

  const getScoreColor = (score) => {
    if (score >= 80) return '#00F5FF';
    if (score >= 50) return '#7B61FF';
    return '#FF4D6D';
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const ScoreChange = ({ oldScore, newScore }) => {
    const diff = newScore - oldScore;
    const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
    const color = diff > 0 ? '#00F5FF' : diff < 0 ? '#FF4D6D' : '#94A3B8';
    return (
      <div className="flex items-center gap-2" style={{ color }}>
        <Icon className="w-5 h-5" />
        <span className="font-bold text-lg">{diff > 0 ? '+' : ''}{diff.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#00F5FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!dataA || !dataB) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <p className="text-slate-400">Unable to load comparison data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C] pb-12">
      <header className="bg-[#0A0F1C]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 px-6 md:px-12 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/history')} className="flex items-center gap-2 text-slate-300 hover:text-[#00F5FF] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to History</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Compare <span className="text-[#00F5FF]">Reports</span>
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12">
        {/* Score Comparison */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Report A */}
          <div className="glass-card p-6 text-center">
            <p className="text-xs text-slate-500 mb-2">Report A</p>
            <p className="text-sm text-slate-400 mb-3">{formatDate(dataA.timestamp)}</p>
            <div className="text-5xl font-black mb-2" style={{ color: getScoreColor(dataA.fairness_score) }}>
              {dataA.fairness_score}
            </div>
            <p className="text-sm text-slate-400">Fairness Score</p>
          </div>

          {/* Change */}
          <div className="glass-card p-6 flex flex-col items-center justify-center">
            <ArrowRight className="w-8 h-8 text-slate-600 mb-3" />
            <ScoreChange oldScore={dataA.fairness_score} newScore={dataB.fairness_score} />
            <p className="text-xs text-slate-500 mt-2">Change</p>
          </div>

          {/* Report B */}
          <div className="glass-card p-6 text-center">
            <p className="text-xs text-slate-500 mb-2">Report B</p>
            <p className="text-sm text-slate-400 mb-3">{formatDate(dataB.timestamp)}</p>
            <div className="text-5xl font-black mb-2" style={{ color: getScoreColor(dataB.fairness_score) }}>
              {dataB.fairness_score}
            </div>
            <p className="text-sm text-slate-400">Fairness Score</p>
          </div>
        </motion.div>

        {/* Disparity Comparison Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 mb-12">
          <h3 className="text-xl font-semibold text-white/90 mb-6">Disparity Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 text-sm text-slate-400 font-semibold">Dimension</th>
                  <th className="py-3 text-sm text-slate-400 font-semibold text-center">Report A</th>
                  <th className="py-3 text-sm text-slate-400 font-semibold text-center">Report B</th>
                  <th className="py-3 text-sm text-slate-400 font-semibold text-center">Change</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Gender', a: dataA.gender_stats?.disparity || 0, b: dataB.gender_stats?.disparity || 0 },
                  { name: 'Income', a: dataA.income_stats?.disparity || 0, b: dataB.income_stats?.disparity || 0 },
                  { name: 'Age', a: dataA.age_stats?.disparity || 0, b: dataB.age_stats?.disparity || 0 },
                  { name: 'Education', a: dataA.education_stats?.disparity || 0, b: dataB.education_stats?.disparity || 0 },
                ].map((row, i) => {
                  const diff = (row.b - row.a) * 100;
                  const color = diff < 0 ? '#00F5FF' : diff > 0 ? '#FF4D6D' : '#94A3B8';
                  return (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-4 text-white font-medium">{row.name}</td>
                      <td className="py-4 text-center text-slate-300">{(row.a * 100).toFixed(1)}%</td>
                      <td className="py-4 text-center text-slate-300">{(row.b * 100).toFixed(1)}%</td>
                      <td className="py-4 text-center font-semibold" style={{ color }}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Alerts Comparison */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white/90 mb-4">Report A Alerts</h3>
            {dataA.bias_alerts?.length > 0 ? (
              <div className="space-y-2">
                {dataA.bias_alerts.map((a, i) => (
                  <div key={i} className="bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 rounded-lg p-3 text-sm text-slate-200">{a}</div>
                ))}
              </div>
            ) : <p className="text-sm text-[#00F5FF]">No bias alerts</p>}
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white/90 mb-4">Report B Alerts</h3>
            {dataB.bias_alerts?.length > 0 ? (
              <div className="space-y-2">
                {dataB.bias_alerts.map((a, i) => (
                  <div key={i} className="bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 rounded-lg p-3 text-sm text-slate-200">{a}</div>
                ))}
              </div>
            ) : <p className="text-sm text-[#00F5FF]">No bias alerts</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ComparePage;
