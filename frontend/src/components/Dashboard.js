import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Users, DollarSign, Clock, GraduationCap } from "lucide-react";

const Dashboard = ({ data }) => {
  const { fairness_score, gender_stats, income_stats, age_stats, education_stats, bias_alerts } = data;

  const getScoreColor = (score) => {
    if (score >= 80) return '#00F5FF';
    if (score >= 50) return '#7B61FF';
    return '#FF4D6D';
  };

  const scoreColor = getScoreColor(fairness_score);
  const shouldPulse = fairness_score < 50;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const label = d.gender || d.bracket || d.level || '';
      return (
        <div className="glass-card p-3">
          <p className="text-white font-semibold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-slate-300">
              {entry.name}: <span className="font-semibold" style={{ color: entry.color }}>{entry.value}</span>
            </p>
          ))}
          <p className="text-sm text-slate-400 mt-1">Rate: {d.rate?.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  const ChartCard = ({ testId, icon, title, data: chartData, dataKey, delay, colSpan }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      data-testid={testId}
      className={`glass-card p-6 ${colSpan} min-h-[380px]`}
    >
      <div className="flex items-center gap-3 mb-6">
        {icon}
        <h3 className="text-xl font-semibold text-white/90">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey={dataKey} stroke="rgba(255,255,255,0.5)" style={{ fontSize: '13px' }} />
          <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '13px' }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Legend wrapperStyle={{ color: '#fff' }} />
          <Bar dataKey="hired" fill="#00F5FF" name="Hired" radius={[6, 6, 0, 0]} />
          <Bar dataKey="not_hired" fill="#7B61FF" name="Not Hired" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {/* Fairness Score */}
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
        <div className="text-6xl font-black" style={{ color: scoreColor }}>{fairness_score}</div>
        <p className="text-sm text-slate-400 mt-2">out of 100</p>
      </motion.div>

      {/* Gender Chart */}
      {gender_stats?.chart_data?.length > 0 && (
        <ChartCard
          testId="dashboard-gender-chart"
          icon={<Users className="w-6 h-6 text-[#00F5FF]" />}
          title="Gender vs Hired"
          data={gender_stats.chart_data}
          dataKey="gender"
          delay={0.1}
          colSpan="col-span-1 md:col-span-1 lg:col-span-3"
        />
      )}

      {/* Income Chart */}
      {income_stats?.chart_data?.length > 0 && (
        <ChartCard
          testId="dashboard-income-chart"
          icon={<DollarSign className="w-6 h-6 text-[#7B61FF]" />}
          title="Income vs Selection"
          data={income_stats.chart_data}
          dataKey="bracket"
          delay={0.2}
          colSpan="col-span-1 md:col-span-2"
        />
      )}

      {/* Age Chart */}
      {age_stats?.chart_data?.length > 0 && (
        <ChartCard
          testId="dashboard-age-chart"
          icon={<Clock className="w-6 h-6 text-[#00F5FF]" />}
          title="Age vs Hired"
          data={age_stats.chart_data}
          dataKey="bracket"
          delay={0.3}
          colSpan="col-span-1 md:col-span-2"
        />
      )}

      {/* Education Chart */}
      {education_stats?.chart_data?.length > 0 && (
        <ChartCard
          testId="dashboard-education-chart"
          icon={<GraduationCap className="w-6 h-6 text-[#7B61FF]" />}
          title="Education Level vs Hired"
          data={education_stats.chart_data}
          dataKey="level"
          delay={0.35}
          colSpan="col-span-1 md:col-span-2 lg:col-span-4"
        />
      )}

      {/* Bias Alerts */}
      {bias_alerts?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          data-testid="dashboard-bias-alerts"
          className="glass-card p-6 col-span-1 md:col-span-2 lg:col-span-4 border-[#FF4D6D]/30"
        >
          <h3 className="text-xl font-semibold text-white/90 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-[#FF4D6D] rounded-full animate-pulse"></span>
            Bias Alerts
          </h3>
          <div className="space-y-3">
            {bias_alerts.map((alert, i) => (
              <div key={i} className="bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 rounded-lg p-4 flex items-start gap-3">
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
