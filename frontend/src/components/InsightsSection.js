import { motion } from "framer-motion";
import { Lightbulb, CheckCircle2 } from "lucide-react";

const InsightsSection = ({ insights, alerts }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card p-8 mb-12"
    >
      <div className="flex items-center gap-3 mb-6">
        <Lightbulb className="w-8 h-8 text-[#00F5FF]" />
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          AI-Generated Insights
        </h2>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
            className="flex items-start gap-4 bg-[#00F5FF]/5 border border-[#00F5FF]/20 rounded-lg p-4 hover:bg-[#00F5FF]/10 transition-colors"
          >
            <CheckCircle2 className="w-5 h-5 text-[#00F5FF] flex-shrink-0 mt-0.5" />
            <p className="text-base leading-relaxed text-slate-300">{insight}</p>
          </motion.div>
        ))}
      </div>

      {alerts.length === 0 && (
        <div className="mt-6 p-4 bg-[#00F5FF]/10 border border-[#00F5FF]/30 rounded-lg">
          <p className="text-center text-slate-200">
            <span className="font-semibold text-[#00F5FF]">Great news!</span> No critical bias patterns detected. Keep monitoring your hiring data regularly.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default InsightsSection;
