import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { TrendingUp, Users, DollarSign } from "lucide-react";

const Dashboard = ({ data }) => {
  const { fairness_score, gender_stats, income_stats, bias_alerts } = data;

  const getScoreColor = (score) => {
    if (score >= 80) return '#00F5FF';
    if (score >= 50) return '#7B61FF';
    return '#FF4D6D';
  };

  const scoreColor = getScoreColor(fairness_score);
  const shouldPulse = fairness_score < 50;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3">
          <p className="text-white font-semibold mb-1">{payload[0].payload.gender || payload[0].payload.bracket}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-slate-300">
              {entry.name}: <span className="font-semibold" style={{ color: entry.color }}>{entry.value}</span>
            </p>
          ))}
          <p className="text-sm text-slate-400 mt-1">
            Rate: {payload[0].payload.rate.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
      {/* Fairness Score Widget */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        data-testid="dashboard-fairness-score"
        className={`glass-card p-6 col-span-1 min-h-[200px] flex flex-col justify-center items-center ${shouldPulse ? 'animate-pulse-glow' : ''}`}
        style={{ borderColor: `${scoreColor}40` }}
      >
        <TrendingUp className="w-12 h-12 mb-4" style={{ color: scoreColor }} />
        <h3 className="text-lg font-semibold text-white/90 mb-2">Fairness Score</h3>
        <div className="text-6xl font-black" style={{ color: scoreColor }}>
          {fairness_score}
        </div>
        <p className="text-sm text-slate-400 mt-2">out of 100</p>
      </motion.div>

      {/* Gender Chart */}
      {gender_stats.chart_data.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          data-testid="dashboard-gender-chart"
          className="glass-card p-6 col-span-1 md:col-span-2 lg:col-span-3 min-h-[400px]"
        >
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-[#00F5FF]" />
            <h3 className="text-xl font-semibold text-white/90">Gender-Based Hiring Analysis</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={gender_stats.chart_data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis 
                dataKey="gender" 
                stroke="rgba(255, 255, 255, 0.5)" 
                style={{ fontSize: '14px' }}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.5)" 
                style={{ fontSize: '14px' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Bar dataKey="hired" fill="#00F5FF" name="Hired" radius={[8, 8, 0, 0]} />
              <Bar dataKey="not_hired" fill="#7B61FF" name="Not Hired" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-400">
              Disparity Level: <span className="font-semibold text-white">{(gender_stats.disparity * 100).toFixed(1)}%</span>
            </p>
          </div>
        </motion.div>
      )}

      {/* Income Chart */}
      {income_stats.chart_data.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          data-testid="dashboard-income-chart"
          className="glass-card p-6 col-span-1 md:col-span-3 lg:col-span-4 min-h-[400px]"
        >
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-6 h-6 text-[#7B61FF]" />
            <h3 className="text-xl font-semibold text-white/90">Income-Based Hiring Analysis</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={income_stats.chart_data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis 
                dataKey="bracket" 
                stroke="rgba(255, 255, 255, 0.5)" 
                style={{ fontSize: '14px' }}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.5)" 
                style={{ fontSize: '14px' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Bar dataKey="hired" fill="#7B61FF" name="Hired" radius={[8, 8, 0, 0]} />
              <Bar dataKey="not_hired" fill="#00F5FF" name="Not Hired" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-400">
              Disparity Level: <span className="font-semibold text-white">{(income_stats.disparity * 100).toFixed(1)}%</span>
            </p>
          </div>
        </motion.div>
      )}

      {/* Bias Alerts */}
      {bias_alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          data-testid="dashboard-bias-alerts"
          className="glass-card p-6 col-span-1 md:col-span-3 lg:col-span-4 border-[#FF4D6D]/30"
        >
          <h3 className="text-xl font-semibold text-white/90 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-[#FF4D6D] rounded-full animate-pulse"></span>
            Bias Alerts
          </h3>
          <div className="space-y-3">
            {bias_alerts.map((alert, index) => (
              <div 
                key={index}
                className="bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 rounded-lg p-4 flex items-start gap-3"
              >
                <div className="w-2 h-2 bg-[#FF4D6D] rounded-full mt-2"></div>
                <p className="text-sm text-slate-200 flex-1">{alert}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
